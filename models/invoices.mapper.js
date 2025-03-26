// ===== IMPORTS ===== //
const CoreMapper = require("./core.mapper");

// ===== INVOICES MAPPER ===== //
class InvoicesMapper extends CoreMapper {
  tableName = "invoices";

  // ------------------------------------------------------------------------------------ //
  // Mapper to get invoice years
  async getYearsInvoiceUser(userId) {
    const records = await this.db(this.tableName)
      .select({
        filterByFormula: `{user_id} = '${userId}'`,
        fields: ["invoice_year"],
      })
      .all();

    const years = [...new Set(records.map((record) => record.fields.invoice_year))];

    return years.sort((a, b) => b - a);
  }

  // ------------------------------------------------------------------------------------ //
  // Mapper to get invoices by his year
  async getUserInvoicesByYear(userId, invoiceYear) {
    const records = await this.db(this.tableName)
      .select({
        filterByFormula: `AND({user_id} = '${userId}', {invoice_year} = '${invoiceYear}')`,
      })
      .all();

    return records.map((record) => {
      const { id: recordId, fields: invoice } = record;
      const { ...invoiceData } = invoice;
      return { ...invoiceData, recordId };
    });
  }

  // ------------------------------------------------------------------------------------ //
  // Mapper to get invoices data
  async getUserInvoices(userId) {
    const records = await this.db(this.tableName)
      .select({
        filterByFormula: `{user_id} = '${userId}'`,
      })
      .all();

    return records.map((record) => {
      const { id: recordId, fields: invoice } = record;
      const { ...invoiceData } = invoice;
      return { ...invoiceData, recordId };
    });
  }

  // ------------------------------------------------------------------------------------ //
  // Mapper to add new invoice
  async addInvoice(invoiceData) {
    const { invoiceMonth, invoiceYear, userId, invoiceClientId } = invoiceData;

    const createdInvoice = await this.db(this.tableName).create([
      {
        fields: {
          invoice_month: invoiceMonth,
          invoice_year: invoiceYear,
          invoice_client_id: invoiceClientId,
          user_id: userId,
        },
      },
    ]);

    const invoiceId = createdInvoice[0].fields.invoice_id;
    return invoiceId;
  }
}

module.exports = InvoicesMapper;
