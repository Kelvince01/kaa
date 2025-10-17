import { ComplianceService } from "../compliance.service";
import { RecurringPaymentService } from "../payments/recurring-payments.service";
import { InsuranceService } from "../properties/insurance.service";

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class SchedulerService {
  /**
   * Initialize all scheduled tasks
   */
  static async initializeScheduledTasks(): Promise<void> {
    console.log("Initializing scheduled tasks...");

    // Daily tasks
    SchedulerService.scheduleDailyTasks();

    // Weekly tasks
    SchedulerService.scheduleWeeklyTasks();

    // Monthly tasks
    await SchedulerService.scheduleMonthlyTasks();
  }

  /**
   * Schedule daily tasks
   */
  private static scheduleDailyTasks(): void {
    // Run every day at 6:00 AM
    setInterval(
      async () => {
        try {
          console.log("Running daily scheduled tasks...");

          // Process due recurring payments
          await RecurringPaymentService.processDuePayments();

          // Process late fees
          await RecurringPaymentService.processLateFees();

          // Send payment reminders
          await RecurringPaymentService.sendPaymentReminders();

          // Check expiring insurance policies
          await InsuranceService.checkExpiringPolicies();

          // Check overdue insurance payments
          await InsuranceService.checkOverduePayments();

          // Check expiring compliance records
          await ComplianceService.checkExpiringCompliance();

          // Check upcoming inspections
          await ComplianceService.checkUpcomingInspections();

          console.log("Daily scheduled tasks completed");
        } catch (error) {
          console.error("Error running daily scheduled tasks:", error);
        }
      },
      24 * 60 * 60 * 1000
    ); // 24 hours
  }

  /**
   * Schedule weekly tasks
   */
  private static scheduleWeeklyTasks(): void {
    // Run every Sunday at 2:00 AM
    setInterval(
      async () => {
        try {
          console.log("Running weekly scheduled tasks...");

          // Generate weekly financial reports
          await SchedulerService.generateWeeklyReports();

          // Update property valuations for high-value properties
          await SchedulerService.updateHighValuePropertyValuations();

          console.log("Weekly scheduled tasks completed");
        } catch (error) {
          console.error("Error running weekly scheduled tasks:", error);
        }
      },
      7 * 24 * 60 * 60 * 1000
    ); // 7 days
  }

  /**
   * Schedule monthly tasks
   */
  private static scheduleMonthlyTasks(): void {
    // Run on the 1st of every month at 1:00 AM
    setInterval(
      async () => {
        try {
          console.log("Running monthly scheduled tasks...");

          // Generate monthly financial reports
          await SchedulerService.generateMonthlyReports();

          // Update all property valuations
          await SchedulerService.updateAllPropertyValuations();

          // Generate compliance reports
          await SchedulerService.generateComplianceReports();

          console.log("Monthly scheduled tasks completed");
        } catch (error) {
          console.error("Error running monthly scheduled tasks:", error);
        }
      },
      30 * 24 * 60 * 60 * 1000
    ); // 30 days (approximate)
  }

  /**
   * Generate weekly reports
   */
  private static async generateWeeklyReports(): Promise<void> {
    // This would generate weekly reports for all landlords
    console.log("Generating weekly reports...");
    // Implementation would go here
    await Promise.resolve();
  }

  /**
   * Update high-value property valuations
   */
  private static async updateHighValuePropertyValuations(): Promise<void> {
    // This would update valuations for properties above a certain value threshold
    console.log("Updating high-value property valuations...");
    // Implementation would go here
    await Promise.resolve();
  }

  /**
   * Generate monthly reports
   */
  private static async generateMonthlyReports(): Promise<void> {
    // This would generate monthly reports for all landlords
    console.log("Generating monthly reports...");
    // Implementation would go here
    await Promise.resolve();
  }

  /**
   * Update all property valuations
   */
  private static async updateAllPropertyValuations(): Promise<void> {
    // This would update valuations for all properties
    console.log("Updating all property valuations...");
    // Implementation would go here
    await Promise.resolve();
  }

  /**
   * Generate compliance reports
   */
  private static async generateComplianceReports(): Promise<void> {
    // This would generate compliance reports for all landlords
    console.log("Generating compliance reports...");
    // Implementation would go here
    await Promise.resolve();
  }

  /**
   * Run a specific task manually
   */
  static async runTask(taskName: string): Promise<void> {
    console.log(`Running task: ${taskName}`);

    switch (taskName) {
      case "process_due_payments":
        await RecurringPaymentService.processDuePayments();
        break;
      case "process_late_fees":
        await RecurringPaymentService.processLateFees();
        break;
      case "send_payment_reminders":
        await RecurringPaymentService.sendPaymentReminders();
        break;
      case "check_expiring_policies":
        await InsuranceService.checkExpiringPolicies();
        break;
      case "check_overdue_payments":
        await InsuranceService.checkOverduePayments();
        break;
      case "check_expiring_compliance":
        await ComplianceService.checkExpiringCompliance();
        break;
      case "check_upcoming_inspections":
        await ComplianceService.checkUpcomingInspections();
        break;
      default:
        throw new Error(`Unknown task: ${taskName}`);
    }

    console.log(`Task completed: ${taskName}`);
  }
}
