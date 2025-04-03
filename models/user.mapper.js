// ===== IMPORTS ===== //
const CoreMapper = require("./core.mapper");

// ===== USER MAPPER ===== //
class UserMapper extends CoreMapper {
  tableName = "user";

  // ------------------------------------------------------------------------------------ //
  // Mapper to get user data by mail
  async getUserByEmail(userEmail) {
    const records = await this.db(this.tableName)
      .select({
        filterByFormula: `{user_email} = '${userEmail}'`,
      })
      .all();

    const { id: recordId, fields: user } = records[0];
    return { ...user, recordId };
  }

  // ------------------------------------------------------------------------------------ //
  // Mapper to get user data by id
  async getUserById(userId) {
    const records = await this.db(this.tableName)
      .select({
        filterByFormula: `{user_id} = '${userId}'`,
      })
      .all();

    const { id: recordId, fields: user } = records[0];
    return { ...user, recordId };
  }

  // ------------------------------------------------------------------------------------ //
  // Mapper to update user data
  async updateUser(user) {
    const { lastName, firstName, email, adress, city, zipCode, legalForm, siret, bankName, bicSwift, iban, recordId } =
      user;

    await this.db(this.tableName).update(recordId, {
      user_first_name: firstName,
      user_last_name: lastName,
      legal_form: legalForm,
      user_adress: adress,
      user_city_name: city,
      user_zip_code: zipCode,
      user_siret: siret,
      user_email: email,
      user_bank_name: bankName,
      user_iban: iban,
      user_bic_swift: bicSwift,
    });
  }

  // ------------------------------------------------------------------------------------ //
  // Mapper to create a new user
  async createUser(data) {
    const { lastName, firstName, email, password } = data;

    await this.db(this.tableName).create([
      {
        fields: {
          user_first_name: firstName,
          user_last_name: lastName,
          user_email: email,
          password: password,
        },
      },
    ]);
  }
}

module.exports = UserMapper;
