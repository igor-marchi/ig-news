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
      // why 254 in length https://stackoverflow.com/a/1199238
      type: "varchar(254)",
      notNull: true,
      unique: true,
    },
    password: {
      // why 72 in length https://security.stackexchange.com/a/39851
      type: "varchar(72)",
      notNull: true,
    },
    // why timezone with timezone https://justatheory.com/2012/04/postgres-use-timestamptz/
    created_at: {
      type: "timestamptz",
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      default: pgm.func("now()"),
    },
  });
};

exports.down = false;
