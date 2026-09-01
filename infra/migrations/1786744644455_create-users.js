exports.up = (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    username: {
      // For reference, GitHub limits usernames to 30 chars
      type: "varchar(30)",
      notNull: true,
      unique: true,
    },
    email: {
      // why 254 in length? https://stackoverflow.com/a/1199238
      type: "varchar(254)",
      notNull: true,
      unique: true,
    },
    password: {
      // why 60 in length? https://www.npmjs.com/package/bcrypt#hash-info
      type: "varchar(60)",
      notNull: true,
    },
    // why timezone with timezone? https://justatheory.com/2012/04/postgres-use-timestamptz/
    created_at: {
      type: "timestamptz",
      default: pgm.func("timezone('utc', now())"),
      notNull: true,
    },
    updated_at: {
      type: "timestamptz",
      default: pgm.func("timezone('utc', now())"),
      notNull: true,
    },
  });
};

exports.down = false;
