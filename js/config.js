const DATA_VERSION = Date.now();

const baseUrl = "https://raw.githubusercontent.com/debajitd1292/v.beta/main/";

const holidayUrl =
    baseUrl + "updates/holiday.csv?v=" + DATA_VERSION;

const notesUrl =
    baseUrl + "updates/notes.csv?v=" + DATA_VERSION;

const alertsUrl =
    baseUrl + "updates/alerts.csv?v=" + DATA_VERSION;

const trainingUrl =
    baseUrl + "updates/training.csv?v=" + DATA_VERSION;

const productionPlanUrl =
    baseUrl + "production/production_plan.csv?v=" + DATA_VERSION;

const productionTargetUrl =
    baseUrl + "production/production_target.csv?v=" + DATA_VERSION;

const seniorityExecUrl =
    baseUrl + "seniority/seniority_exec.csv?v=" + DATA_VERSION;

const seniorityNonExecUrl =
    baseUrl + "seniority/seniority_nonexec.csv?v=" + DATA_VERSION;
