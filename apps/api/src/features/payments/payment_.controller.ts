// async function processRentPayment(applicationId, amount) {
//   // Option 1: Pay from wallet
//   const wallet = await Wallet.findOne({ userId: user.id });
//   if (wallet && wallet.balance.available >= amount) {
//     return await walletController.payRent({
//       propertyId,
//       amount,
//       applicationId,
//     });
//   }

//   // Option 2: Direct M-Pesa payment
//   return await mpesaService.stkPush({ amount, ... });
// }
