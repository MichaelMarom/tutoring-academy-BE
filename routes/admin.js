const sendTemplatedEmail = require("../config/sendTemplateEmail");
const sendMultipleEmails = require("../config/sendingEmails");
const { sendingSMS } = require("../config/sendingMessages");
const {
  get_tutor_data,
  set_tutor_status,
  get_student_data,
  set_student_status,
  get_tutor_new_subject,
  accept_new_subject,
  decline_new_subject,
  get_Constants,
  postTerms,
  get_users_list,
  get_new_sub_count,
  get_role_count_by_status,
  api_save_email_template,
  api_get_email_templates,
  api_get_email_template,
  api_update_email_template,
} = require("../controllers/admin");
const { verifyToken } = require("../controllers/auth");
const { express, parser } = require("../modules");
const ADMIN_ROUTES = express.Router();

ADMIN_ROUTES.get("/admin/tutor-data", verifyToken, get_tutor_data);
ADMIN_ROUTES.get(
  "/admin/:role/status/count",
  verifyToken,
  get_role_count_by_status
);
ADMIN_ROUTES.get("/admin/user/list", verifyToken, get_users_list)
ADMIN_ROUTES.get("/admin/student-data", verifyToken, get_student_data);
ADMIN_ROUTES.get(
  "/admin/tutor-new-subject",
  verifyToken,
  get_tutor_new_subject
);

ADMIN_ROUTES.get(
  "/admin/tutor/new-subject/count",
  verifyToken,
  get_new_sub_count
);

ADMIN_ROUTES.get("/admin/get-constants/:id", verifyToken, get_Constants);

ADMIN_ROUTES.post(
  "/admin/set-tutor-status",
  parser,
  verifyToken,
  set_tutor_status
);
ADMIN_ROUTES.post(
  "/admin/set-student-status",
  parser,
  verifyToken,
  set_student_status
);
ADMIN_ROUTES.post(
  "/admin/post-new-subject",
  parser,
  verifyToken,
  accept_new_subject
);
ADMIN_ROUTES.post(
  "/admin/delete-new-subject",
  parser,
  verifyToken,
  decline_new_subject
);
ADMIN_ROUTES.post("/admin/store-terms", parser, verifyToken, postTerms);
ADMIN_ROUTES.post("/send-message", parser, verifyToken, sendingSMS);
ADMIN_ROUTES.post("/send-email", parser, verifyToken, sendMultipleEmails);
ADMIN_ROUTES.post("/send-email/chat", parser, verifyToken, sendTemplatedEmail);

ADMIN_ROUTES.post("/admin/email-template", parser, verifyToken, api_save_email_template);
ADMIN_ROUTES.get("/admin/email-template/list", verifyToken, api_get_email_templates);
ADMIN_ROUTES.get("/admin/email-template/:id", verifyToken, api_get_email_template);
ADMIN_ROUTES.put("/admin/email-template/:id", parser, verifyToken, api_update_email_template);

module.exports = {
  ADMIN_ROUTES,
};
