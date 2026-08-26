/**
 * A minimal in-memory stand-in for a Mongoose Model, supporting only the query methods this
 * codebase actually calls. This exists because real MongoDB is unreachable from this sandbox
 * (confirmed repeatedly across every phase of this project — the mongodb-memory-server binary
 * download is blocked by network policy). Rather than skip backend testing entirely, every
 * test in this suite exercises the REAL service/controller/route code with only the Mongoose
 * model layer swapped for this fake — the business logic, validation, and HTTP wiring under
 * test are 100% real, not reimplemented.
 *
 * This is a genuine limitation, stated here and in the QA report: these tests cannot catch a
 * real MongoDB driver bug, a bad index, or a schema-level validation quirk that only manifests
 * against the real database engine. They DO catch logic bugs, authorization bugs, and
 * regressions in anything this codebase's own code decides — which is the overwhelming
 * majority of what has actually gone wrong in this project so far.
 */

let idCounter = 0;
export function nextId(): string {
  idCounter += 1;
  return String(idCounter).padStart(24, "0");
}

type Doc = Record<string, unknown> & { _id: unknown };

function getPath(doc: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, doc);
}

function matches(doc: Doc, filter: Record<string, unknown>): boolean {
  return Object.entries(filter).every(([key, value]) => {
    if (value instanceof RegExp) {
      return value.test(String(getPath(doc, key) ?? ""));
    }
    if (value && typeof value === "object" && "$in" in (value as Record<string, unknown>)) {
      const arr = (value as { $in: unknown[] }).$in;
      return arr.some((v) => String(v) === String(getPath(doc, key)));
    }
    if (key === "$or" && Array.isArray(value)) {
      return (value as Record<string, unknown>[]).some((sub) => matches(doc, sub));
    }
    return String(getPath(doc, key)) === String(value);
  });
}

export class FakeCollection<T extends Doc = Doc> {
  public docs: T[] = [];

  private wrap(doc: T | null) {
    if (!doc) return null;
    const self = this;
    return {
      ...doc,
      save: async function (this: T) {
        const idx = self.docs.findIndex((d) => d._id === this._id);
        if (idx >= 0) self.docs[idx] = this;
        else self.docs.push(this);
        return this;
      },
      deleteOne: async function (this: T) {
        self.docs = self.docs.filter((d) => d._id !== this._id);
      },
      toObject: function (this: T) {
        const { save: _s, deleteOne: _d, toObject: _t, ...rest } = this as never;
        return rest;
      },
    } as T & { save: () => Promise<T>; deleteOne: () => Promise<void>; toObject: () => T };
  }

  findById = (id: string) => {
    const found = this.docs.find((d) => String(d._id) === String(id)) ?? null;
    const wrapped = this.wrap(found);
    const chain = {
      lean: async () => (found ? { ...found } : null),
      select: () => ({ lean: async () => (found ? { ...found } : null) }),
      populate: () => chain,
      then: (resolve: (v: unknown) => void) => resolve(wrapped),
    };
    return chain;
  };

  findOne = (filter: Record<string, unknown> = {}) => {
    const found = this.docs.find((d) => matches(d, filter)) ?? null;
    const wrapped = this.wrap(found);
    const chain = {
      lean: async () => (found ? { ...found } : null),
      then: (resolve: (v: unknown) => void) => resolve(wrapped),
      select: () => ({ lean: async () => (found ? { ...found } : null) }),
      populate: () => chain,
    };
    return chain;
  };

  find = (filter: Record<string, unknown> = {}) => {
    const results = this.docs.filter((d) => matches(d, filter));
    const chain = {
      sort: () => chain,
      limit: () => chain,
      populate: () => chain,
      lean: async () => results.map((r) => ({ ...r })),
      then: (resolve: (v: unknown) => void) => resolve(results.map((r) => ({ ...r }))),
    };
    return chain;
  };

  create = async (data: Partial<T>) => {
    const doc = { _id: nextId(), ...data } as T;
    this.docs.push(doc);
    return this.wrap(doc);
  };

  insertMany = async (items: Partial<T>[]) => {
    const created = items.map((d) => ({ _id: nextId(), ...d }) as T);
    this.docs.push(...created);
    return created;
  };

  deleteOne = async (filter: Record<string, unknown>) => {
    const before = this.docs.length;
    this.docs = this.docs.filter((d) => !matches(d, filter));
    return { deletedCount: before - this.docs.length };
  };

  deleteMany = async (filter: Record<string, unknown> = {}) => {
    const before = this.docs.length;
    this.docs = this.docs.filter((d) => !matches(d, filter));
    return { deletedCount: before - this.docs.length };
  };

  updateOne = async (filter: Record<string, unknown>, update: { $set?: Record<string, unknown> }) => {
    const doc = this.docs.find((d) => matches(d, filter));
    if (doc && update.$set) Object.assign(doc, update.$set);
    return { modifiedCount: doc ? 1 : 0 };
  };

  updateMany = async (filter: Record<string, unknown>, update: { $set?: Record<string, unknown> }) => {
    const matched = this.docs.filter((d) => matches(d, filter));
    matched.forEach((d) => update.$set && Object.assign(d, update.$set));
    return { modifiedCount: matched.length };
  };

  findOneAndUpdate = (
    filter: Record<string, unknown>,
    update: { $set?: Record<string, unknown> },
    opts?: { upsert?: boolean; new?: boolean },
  ) => {
    let doc = this.docs.find((d) => matches(d, filter));
    if (!doc && opts?.upsert) {
      doc = { _id: nextId(), ...filter, ...(update.$set ?? {}) } as T;
      this.docs.push(doc);
    } else if (doc && update.$set) {
      Object.assign(doc, update.$set);
    }
    const result = doc ?? null;
    return {
      lean: async () => (result ? { ...result } : null),
      then: (resolve: (v: unknown) => void) => resolve(this.wrap(result)),
    };
  };

  countDocuments = async (filter: Record<string, unknown> = {}) =>
    this.docs.filter((d) => matches(d, filter)).length;

  exists = async (filter: Record<string, unknown>) => {
    const found = this.docs.some((d) => matches(d, filter));
    return found ? { _id: "x" } : null;
  };

  reset() {
    this.docs = [];
  }
}
