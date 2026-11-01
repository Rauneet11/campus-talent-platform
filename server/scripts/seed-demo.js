/**
 * Demo data seeder for Campus Talent Platform.
 *
 * Place at: server/scripts/seed-demo.js
 * Run from the server folder:
 *   node scripts/seed-demo.js           -> remove old demo data, then insert fresh demo data
 *   node scripts/seed-demo.js --clean   -> only remove demo data
 *
 * Writes to the database named in MONGO_URI (server/.env).
 * Only records created by this script are touched (usernames demo*, see DEMO_USERNAMES).
 * Refuses to run when NODE_ENV=production.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../src/models/User");
const Admin = require("../src/models/Admin");
const Teacher = require("../src/models/Teacher");
const Student = require("../src/models/Student");
const Project = require("../src/models/Project");
const Invitation = require("../src/models/Invitation");
const Task = require("../src/models/Task");
const ProjectFolder = require("../src/models/ProjectFolder");
const ProjectFile = require("../src/models/ProjectFile");

const DEMO_PASSWORD = "Demo@12345";
const DAY = 24 * 60 * 60 * 1000;
const oid = () => new mongoose.Types.ObjectId();

const DEMO_USERNAMES = [
  "demoadmin",
  "demoteacher1", "demoteacher2", "demoteacher3",
  "demostudent1", "demostudent2", "demostudent3", "demostudent4",
  "demostudent5", "demostudent6", "demostudent7", "demostudent8",
];

// Builds every demo document in memory (no database access).
const buildDemoData = (passwordHash, now = new Date()) => {
  const at = (days) => new Date(now.getTime() + days * DAY);
  const user = (role, username) => ({
    _id: oid(), username, password: passwordHash, role, status: "active", isFirstLogin: false,
  });

  // ---------------- Users ----------------
  const adminUser = user("admin", "demoadmin");
  const teacherUsers = [1, 2, 3].map((n) => user("teacher", `demoteacher${n}`));
  const studentUsers = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => user("student", `demostudent${n}`));

  // ---------------- Admin ----------------
  const admin = {
    _id: oid(), userId: adminUser._id, name: "Demo Admin", employeeId: "DEMO-A001",
    email: "demo.admin@campus.demo", department: "MCA", designation: "HOD",
  };

  // ---------------- Teachers ----------------
  const teacherData = [
    ["Dr. Anita Verma", "DEMO-T001", "MCA", "Associate Professor", ["Machine Learning", "Python", "Data Analytics"], 12],
    ["Prof. Rahul Mehta", "DEMO-T002", "CSE", "Assistant Professor", ["React", "Node.js", "MongoDB"], 7],
    ["Dr. Sunita Rao", "DEMO-T003", "IT", "Professor", ["Cloud Computing", "DevOps", "Cybersecurity"], 15],
  ];
  const teachers = teacherData.map(([name, employeeId, department, designation, skills, experience], i) => ({
    _id: oid(), userId: teacherUsers[i]._id, name, employeeId, department, designation, skills, experience,
    email: `demo.teacher${i + 1}@campus.demo`,
  }));

  // ---------------- Students ----------------
  const studentData = [
    ["Aarav Sharma", "MCA", 1, ["React", "Node.js", "MongoDB"], 8.7],
    ["Priya Singh", "MCA", 1, ["Python", "Machine Learning", "SQL"], 9.1],
    ["Rohan Gupta", "MCA", 2, ["UI/UX", "Figma", "React"], 8.2],
    ["Neha Verma", "CSE", 3, ["Java", "Spring Boot", "MySQL"], 8.9],
    ["Karan Patel", "IT", 2, ["Node.js", "Express", "MongoDB"], 7.8],
    ["Sneha Iyer", "MCA", 2, ["Python", "Pandas", "Power BI"], 8.5],
    ["Aditya Rao", "CSE", 2, ["Docker", "AWS", "Linux"], 7.9],
    ["Meera Nair", "IT", 1, ["Flutter", "Firebase", "Dart"], 8.0],
  ];
  const students = studentData.map(([name, branch, year, skills, cgpa], i) => ({
    _id: oid(), userId: studentUsers[i]._id, name, rollNo: `DEMO-S00${i + 1}`, branch, year, skills, cgpa,
  }));
  const [s1, s2, s3, s4, s5, s6, s7, s8] = students;
  const [t1, t2] = teachers;

  // ---------------- Projects ----------------
  const p1 = {
    _id: oid(), title: "Smart Attendance System",
    description: "Face-recognition based attendance system with a teacher dashboard and monthly reports.",
    category: "Machine Learning", requiredSkills: ["Python", "React", "MongoDB"], teamSize: 4,
    owner: s1._id, members: [s2._id, s3._id], mentor: t1._id, createdBy: null, projectType: "Student",
    startDate: at(-30), endDate: at(60), status: "In Progress", isActive: true,
    githubRepoUrl: "https://github.com/demo-campus/smart-attendance",
  };
  const p2 = {
    _id: oid(), title: "Campus Event Portal",
    description: "Portal for clubs to publish events and for students to register and receive reminders.",
    category: "Web Development", requiredSkills: ["Node.js", "Express", "React"], teamSize: 3,
    owner: s4._id, members: [s5._id], mentor: t2._id, createdBy: null, projectType: "Student",
    startDate: at(-14), endDate: at(75), status: "Open", isActive: true,
  };
  const p3 = {
    _id: oid(), title: "Placement Analytics Dashboard",
    description: "Admin-assigned project: dashboards that analyse placement data by branch and year.",
    category: "Data Analytics", requiredSkills: ["Python", "Pandas", "Power BI"], teamSize: 4,
    owner: null, members: [s1._id, s6._id], mentor: t1._id, createdBy: admin._id, projectType: "Admin",
    startDate: at(-20), endDate: at(50), status: "In Progress", isActive: true,
  };
  const projects = [p1, p2, p3];

  // ---------------- Invitations ----------------
  const inv = (project, senderUser, receiver, status, message, daysAgo) => ({
    _id: oid(), projectId: project._id, sender: senderUser._id, receiver: receiver._id, status, message,
    responseDate: status === "Pending" ? null : at(-daysAgo),
  });
  const invitations = [
    inv(p1, studentUsers[0], s2, "Accepted", "Your ML skills would be great for this project.", 25),
    inv(p1, studentUsers[0], s3, "Accepted", "We need a UI designer.", 24),
    inv(p1, studentUsers[0], s8, "Rejected", "Interested in a mobile companion app?", 20),
    inv(p1, studentUsers[0], s7, "Pending", "Can you help with deployment?", 0),
    inv(p2, studentUsers[3], s5, "Accepted", "Backend developer needed.", 12),
    inv(p2, studentUsers[3], s1, "Pending", "Join us for the event portal frontend.", 0),
    inv(p3, adminUser, s1, "Accepted", "Assigned by the HOD office.", 18),
    inv(p3, adminUser, s6, "Accepted", "Assigned by the HOD office.", 18),
    inv(p3, adminUser, s8, "Pending", "Mobile dashboard support needed.", 0),
  ];

  // ---------------- Tasks ----------------
  const task = (project, mentor, mentorUser, student, title, description, priority, status, due) => ({
    _id: oid(), title, description, projectId: project._id, assignedTo: student._id, assignedBy: mentor._id,
    createdByUser: mentorUser._id, priority, status, dueDate: at(due),
    completedAt: status === "Completed" ? at(due - 1) : null,
  });
  const tasks = [
    task(p1, t1, teacherUsers[0], s1, "Design database schema", "Design collections for students, classes and attendance records.", "High", "Completed", -20),
    task(p1, t1, teacherUsers[0], s2, "Build face recognition module", "Train and integrate the face recognition model with an API endpoint.", "High", "In Progress", 10),
    task(p1, t1, teacherUsers[0], s3, "Create attendance report UI", "Build the monthly attendance report screen with filters.", "Medium", "Pending", 25),
    task(p1, t1, teacherUsers[0], s1, "Write API documentation", "Document all endpoints with request and response examples.", "Low", "Pending", -5),
    task(p2, t2, teacherUsers[1], s4, "Collect event requirements", "Meet club coordinators and list required event fields.", "Medium", "Completed", -7),
    task(p2, t2, teacherUsers[1], s5, "Implement event registration form", "Build the registration form with validation and confirmation.", "High", "In Progress", 14),
    task(p3, t1, teacherUsers[0], s1, "Clean placement dataset", "Remove duplicates and fix missing values in the placement data.", "Medium", "Completed", -10),
    task(p3, t1, teacherUsers[0], s6, "Build dashboard charts", "Create branch-wise and year-wise placement charts.", "High", "In Progress", 12),
  ];

  // ---------------- Folders (files need Cloudinary, so none are seeded) ----------------
  const docs = { _id: oid(), projectId: p1._id, name: "Documents", parentFolder: null, createdBy: s1._id, createdByModel: "Student" };
  const folders = [
    docs,
    { _id: oid(), projectId: p1._id, name: "Design", parentFolder: null, createdBy: s1._id, createdByModel: "Student" },
    { _id: oid(), projectId: p1._id, name: "Meeting Notes", parentFolder: docs._id, createdBy: s2._id, createdByModel: "Student" },
    { _id: oid(), projectId: p2._id, name: "Requirements", parentFolder: null, createdBy: s4._id, createdByModel: "Student" },
  ];

  return {
    users: [adminUser, ...teacherUsers, ...studentUsers],
    admins: [admin], teachers, students, projects, invitations, tasks, folders,
  };
};

const cleanup = async () => {
  const users = await User.find({ username: { $in: DEMO_USERNAMES } }).select("_id");
  const userIds = users.map((u) => u._id);
  const ids = async (Model) => (await Model.find({ userId: { $in: userIds } }).select("_id")).map((d) => d._id);
  const [studentIds, teacherIds, adminIds] = await Promise.all([ids(Student), ids(Teacher), ids(Admin)]);

  const projectIds = (
    await Project.find({
      $or: [{ owner: { $in: studentIds } }, { mentor: { $in: teacherIds } }, { createdBy: { $in: adminIds } }],
    }).select("_id")
  ).map((p) => p._id);

  await Promise.all([
    Task.deleteMany({ projectId: { $in: projectIds } }),
    Invitation.deleteMany({ projectId: { $in: projectIds } }),
    ProjectFolder.deleteMany({ projectId: { $in: projectIds } }),
    ProjectFile.deleteMany({ projectId: { $in: projectIds } }),
  ]);
  await Project.deleteMany({ _id: { $in: projectIds } });
  await Promise.all([
    Student.deleteMany({ _id: { $in: studentIds } }),
    Teacher.deleteMany({ _id: { $in: teacherIds } }),
    Admin.deleteMany({ _id: { $in: adminIds } }),
  ]);
  await User.deleteMany({ _id: { $in: userIds } });
};

const main = async () => {
  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to seed demo data when NODE_ENV=production.");
    process.exit(1);
  }
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set in server/.env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  console.log(`Connected. Target database: "${mongoose.connection.name}"`);

  try {
    await cleanup();
    if (process.argv.includes("--clean")) {
      console.log("Demo data removed.");
      return;
    }

    const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const d = buildDemoData(hash);
    await User.insertMany(d.users);
    await Admin.insertMany(d.admins);
    await Teacher.insertMany(d.teachers);
    await Student.insertMany(d.students);
    await Project.insertMany(d.projects);
    await Invitation.insertMany(d.invitations);
    await Task.insertMany(d.tasks);
    await ProjectFolder.insertMany(d.folders);

    console.log("\nDemo data created:");
    console.log(`  1 admin, ${d.teachers.length} teachers, ${d.students.length} students`);
    console.log(`  ${d.projects.length} projects, ${d.invitations.length} invitations, ${d.tasks.length} tasks, ${d.folders.length} folders`);
    console.log(`\nAll demo accounts use the password: ${DEMO_PASSWORD}`);
    console.log("  Admin:    demoadmin");
    console.log("  Teachers: demoteacher1 (mentors 2 projects), demoteacher2 (1 project), demoteacher3 (no projects)");
    console.log("  Students: demostudent1 ... demostudent8");
  } catch (error) {
    console.error("\nSeeding failed:", error.message);
    console.error("Run the script again; it removes partial demo data first.");
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  main();
}

module.exports = { buildDemoData, DEMO_USERNAMES };
