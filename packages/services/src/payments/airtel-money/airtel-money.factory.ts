import { airtelMoneyService } from "./airtel-money.service";

export async function handleCollection({
  customerPhone,
  amount,
  reference,
}: {
  customerPhone: string;
  amount: number;
  reference: string;
}) {
  const authResults = await airtelMoneyService.getAuthToken();
  if (authResults.success && authResults.data) {
    const accessToken = authResults.data.access_token;
    const transactionId = Date.now().toString();

    // const amount = 45_000;
    // const customerPhone = "708658321";
    // const reference = "bill";

    // Initiate collection
    const collectResults = await airtelMoneyService.collectMoney(
      accessToken,
      reference,
      customerPhone,
      amount,
      transactionId
    );
    if (collectResults.success) {
      // Wait 20 seconds for user to complete USSD
      await new Promise((resolve) => setTimeout(resolve, 20_000));

      // Check status
      const statusResults = await airtelMoneyService.checkCollectionStatus(
        accessToken,
        transactionId
      );
      if (statusResults.success && statusResults.data) {
        const { status, message } = statusResults.data.data.transaction;
        console.log(`Status: ${status}, Message: ${message}`);
        if (status === "TS") {
          console.log("Transaction successful!");
        } else if (status === "TIP") {
          console.log("Transaction in progress.");
        } else if (status === "TA") {
          console.log("Transaction ambiguous.");
        } else if (status === "TF") {
          console.log("Transaction failed.");
        }
      } else {
        console.error("Failed to check status:", statusResults.message);
      }
    } else {
      console.error("Collection failed:", collectResults.message);
    }
  } else {
    console.error("Auth failed:", authResults.message);
  }
}

export async function handleRemittance({
  payeePhone,
  amount,
}: {
  payeePhone: string;
  amount: number;
}) {
  const authResults = await airtelMoneyService.getAuthToken();
  if (authResults.success && authResults.data) {
    const accessToken = authResults.data.access_token;

    // Validate payee
    // const payeePhone = "708658021";
    // const amount = 27000;

    const validateResults = await airtelMoneyService.canReceiveMoney(
      accessToken,
      payeePhone,
      amount
    );
    if (validateResults.success && validateResults.data) {
      const { accountStatus, amlstatus } = validateResults.data.data;
      if (accountStatus === "Y" && amlstatus === "Y") {
        console.log("Payee can receive money.");

        // Transfer money
        const transactionId = Date.now().toString();
        const rawPin = process.env.AIRTEL_PIN || "1234"; // Securely source this
        const transferResults = await airtelMoneyService.transferMoney(
          accessToken,
          payeePhone,
          amount,
          transactionId,
          "Charles",
          "Muhanzi",
          rawPin // Now required as a param for flexibility
        );
        if (transferResults.success) {
          console.log("Transfer initiated successfully.");
          // Wait and check status if needed (similar to collections)
        } else {
          console.error("Transfer failed:", transferResults.message);
        }
      } else {
        console.log("Payee cannot receive money.");
      }
    } else {
      console.error("Validation failed:", validateResults.message);
    }
  } else {
    console.error("Auth failed:", authResults.message);
  }
}
