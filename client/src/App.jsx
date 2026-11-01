import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  FiBookOpen,
  FiClipboard,
  FiHome,
  FiMenu,
  FiUsers,
  FiUserCheck,
  FiUserPlus,
  FiX,
} from 'react-icons/fi';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const api = axios.create({ baseURL: API_BASE, timeout: 15000 });

const tokenKey = 'campus-token';
const userKey = 'campus-user';

const getStoredToken = () => localStorage.getItem(tokenKey);
const getStoredUser = () => {
  const raw = localStorage.getItem(userKey);
  return raw ? JSON.parse(raw) : null;
};

const setSession = (user, token) => {
  localStorage.setItem(userKey, JSON.stringify(user));
  localStorage.setItem(tokenKey, token);
};

const clearSession = () => {
  localStorage.removeItem(userKey);
  localStorage.removeItem(tokenKey);
};

const getAuthHeaders = () => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const titleCase = (value) =>
  !value ? '' : value.charAt(0).toUpperCase() + value.slice(1);

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Something went wrong.';

// =========================================================
// SKELETON LOADING COMPONENT
// =========================================================
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-line wide" />
      <div className="skeleton-line medium" />
      <div className="skeleton-line narrow" />
    </div>
  );
}

function SkeletonGrid({ count = 3 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }, (_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

// =========================================================
// PROGRESS BAR COMPONENT
// =========================================================
function ProgressBar({ value }) {
  const pct = parseInt(value, 10) || 0;
  return (
    <div className="progress-bar-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

// =========================================================
// TOAST NOTIFICATION SYSTEM
// =========================================================
function useToast() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const showToast = useCallback((message, type = 'info') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, dismiss };
}

function ToastContainer({ toasts, dismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`} role="alert">
          <span>{toast.message}</span>
          <button className="toast-dismiss" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">×</button>
        </div>
      ))}
    </div>
  );
}

const defaultProjectForm = {
  title: '',
  description: '',
  category: '',
  requiredSkills: '',
  teamSize: 3,
  mentor: '',
  startDate: '',
  endDate: '',
};

const defaultStudentForm = {
  name: '',
  rollNo: '',
  username: '',
  password: '',
  branch: 'MCA',
  year: 1,
  skills: '',
  cgpa: 0,
};

const defaultTeacherForm = {
  name: '',
  employeeId: '',
  username: '',
  password: '',
  department: 'MCA',
  designation: '',
  skills: '',
  experience: 0,
  email: '',
};

function App() {
  const [user, setUser] = useState(getStoredUser());
  const { toasts, showToast, dismiss } = useToast();

  useEffect(() => {
    if (user) {
      setSession(user, getStoredToken());
    }
  }, [user]);

  const handleLogout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" replace /> : <PublicLayout />}
        />
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <PublicLayout />}
        />
        <Route
          path="/dashboard"
          element={
            user ? (
              <AppShell user={user} onLogout={handleLogout}>
                <DashboardView user={user} showToast={showToast} />
              </AppShell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/manage/:section"
          element={
            user ? (
              <AppShell user={user} onLogout={handleLogout}>
                <WorkspaceView user={user} showToast={showToast} />
              </AppShell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/projects/:id"
          element={
            user ? (
              <AppShell user={user} onLogout={handleLogout}>
                <ProjectDetailView user={user} showToast={showToast} />
              </AppShell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </BrowserRouter>
  );
}

function PublicLayout() {
  return (
    <div className="public-layout">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">CT</div>
          <div>
            <p className="eyebrow">Campus Talent Platform</p>
            <h1>Student collaboration and mentoring hub</h1>
          </div>
        </div>
      </header>

      <main className="landing-grid">
        <section className="landing-copy">
          <span className="pill">Built for campus projects</span>
          <h2>Coordinate projects, mentor teams, and manage student work.</h2>
          <p>
            This portal mirrors the real backend: admin management, student profiles,
            teacher assignment, project collaboration, and task tracking for student teams.
          </p>

          <div className="info-grid">
            <div className="mini-card">
              <strong>Role-based access</strong>
              <span>Admin, student, teacher</span>
            </div>
            <div className="mini-card">
              <strong>Project flow</strong>
              <span>Create, invite, track, review</span>
            </div>
            <div className="mini-card">
              <strong>Mentor log</strong>
              <span>Assign tasks and guide progress</span>
            </div>
          </div>
        </section>

        <AuthPanel />
      </main>
    </div>
  );
}

function AuthPanel() {
  const [mode, setMode] = useState('login');
  const [loginRole, setLoginRole] = useState('student');
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/setup-admin';
      const payloadForm = mode === 'login' ? { ...form, role: loginRole } : form;
      const response = await api.post(endpoint, payloadForm);
      const payload = response.data;

      if (mode === 'login') {
        if (!payload.token || !payload.user) {
          throw new Error('Invalid login response.');
        }

        setSession(payload.user, payload.token);
        navigate('/dashboard');
        window.location.reload();
        return;
      }

      setSuccess(payload.message || 'Admin created successfully.');
      setMode('login');
      setForm({ username: '', password: '' });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  return (
    <section className="auth-panel">
      <div className="auth-toggle">
        <button
          type="button"
          className={mode === 'login' ? 'active' : ''}
          onClick={() => setMode('login')}
        >
          Login
        </button>
        <button
          type="button"
          className={mode === 'setup' ? 'active' : ''}
          onClick={() => setMode('setup')}
        >
          Setup admin
        </button>
      </div>

      {mode === 'login' && (
        <fieldset className="login-role-picker">
          <legend>Sign in as</legend>
          {[
            { value: 'student', label: 'Student' },
            { value: 'teacher', label: 'Teacher' },
            { value: 'admin', label: 'Admin' },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={loginRole === value ? 'active' : ''}
              aria-pressed={loginRole === value}
              onClick={() => {
                setLoginRole(value);
                setError('');
              }}
            >
              {label}
            </button>
          ))}
        </fieldset>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Username
          <input
            type="text"
            value={form.username}
            onChange={handleChange('username')}
            placeholder="username"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={handleChange('password')}
            placeholder="password"
            required
          />
        </label>

        {error && <p className="message error">{error}</p>}
        {success && <p className="message success">{success}</p>}

        <button className="primary-btn" type="submit">
          {mode === 'login' ? `Sign in as ${titleCase(loginRole)}` : 'Create admin'}
        </button>
      </form>
    </section>
  );
}

function AppShell({ user, onLogout, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const adminItems = [
    { to: '/dashboard', label: 'Dashboard', icon: FiHome },
    { to: '/manage/students', label: 'Students', icon: FiUsers },
    { to: '/manage/teachers', label: 'Teachers', icon: FiUserCheck },
    { to: '/manage/projects', label: 'Projects', icon: FiBookOpen },
    { to: '/manage/tasks', label: 'Tasks', icon: FiClipboard },
    { to: '/manage/invitations', label: 'Invitations', icon: FiUserPlus },
  ];
  const studentItems = [
    { to: '/dashboard', label: 'Dashboard', icon: FiHome },
    { to: '/manage/my-projects', label: 'My Projects', icon: FiBookOpen },
    { to: '/manage/invitations', label: 'Project Invitations', icon: FiUserPlus },
    { to: '/manage/my-tasks', label: 'My Tasks', icon: FiClipboard },
  ];
  const teacherItems = [
    { to: '/dashboard', label: 'Dashboard', icon: FiHome },
    { to: '/manage/my-projects', label: 'My Projects', icon: FiBookOpen },
    { to: '/manage/tasks', label: 'Task Management', icon: FiClipboard },
  ];
  const navigation = user.role === 'admin'
    ? adminItems
    : user.role === 'student'
      ? studentItems
      : teacherItems;

  return (
    <div className={`app-shell${menuOpen ? ' menu-open' : ''}`}>
      <aside className="sidebar">
        <div className="brand-wrap compact">
          <div className="brand-mark">CT</div>
          <div>
            <p className="eyebrow">Campus</p>
            <strong>Talent Portal</strong>
          </div>
        </div>

        <nav className="nav-stack">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={() => setMenuOpen(false)}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="user-card">
          <span className="user-role">{titleCase(user.role)}</span>
          <strong>{user.username}</strong>
          <button className="ghost-btn" type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

      <div className="workspace">
        <button
          className="mobile-menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open navigation'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
          <span>{menuOpen ? 'Close menu' : 'Menu'}</span>
        </button>
        {menuOpen && (
          <button
            className="mobile-menu-backdrop"
            type="button"
            aria-label="Dismiss navigation menu"
            onClick={() => setMenuOpen(false)}
          />
        )}
        <main className="content-panel">{children}</main>
      </div>
    </div>
  );
}

function DashboardView({ user, showToast }) {
  if (user.role === 'admin') return <AdminDashboard section="dashboard" showToast={showToast} />;
  if (user.role === 'student') return <StudentDashboard showToast={showToast} />;
  if (user.role === 'teacher') return <TeacherDashboard showToast={showToast} />;
  return <Navigate to="/login" replace />;
}

function WorkspaceView({ user, showToast }) {
  const { section } = useParams();
  const adminSections = ['students', 'teachers', 'projects', 'tasks', 'invitations'];
  const studentSections = ['my-projects', 'my-tasks', 'invitations'];
  const teacherSections = ['my-projects', 'tasks'];
  const allowedSections = user.role === 'admin'
    ? adminSections
    : user.role === 'student'
      ? studentSections
      : user.role === 'teacher'
        ? teacherSections
        : [];
  if (!allowedSections.includes(section)) {
    return <Navigate to="/dashboard" replace />;
  }
  if (['students', 'teachers', 'projects'].includes(section) && user.role === 'admin') {
    return <AdminDashboard section={section} showToast={showToast} />;
  }
  if (section === 'tasks' || section === 'my-tasks') {
    return <TaskManagementView user={user} showToast={showToast} />;
  }
  if (section === 'invitations') {
    return user.role === 'student'
      ? <StudentInvitationsView showToast={showToast} />
      : <InvitationManagementView showToast={showToast} />;
  }
  if (section === 'my-projects') {
    return <MemberProjectsView user={user} showToast={showToast} />;
  }
  return <Navigate to="/dashboard" replace />;
}

function AdminDashboard({ section = 'dashboard', showToast }) {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    projects: 0,
    tasks: 0,
    invitations: 0,
  });
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [studentForm, setStudentForm] = useState(defaultStudentForm);
  const [teacherForm, setTeacherForm] = useState(defaultTeacherForm);
  const [projectForm, setProjectForm] = useState(defaultProjectForm);
  const [loading, setLoading] = useState(true);
  const [studentMsg, setStudentMsg] = useState('');
  const [studentMsgIsError, setStudentMsgIsError] = useState(false);
  const [teacherMsg, setTeacherMsg] = useState('');
  const [teacherMsgIsError, setTeacherMsgIsError] = useState(false);
  const [projectMsg, setProjectMsg] = useState('');
  const [projectMsgIsError, setProjectMsgIsError] = useState(false);
  const [studentCredentials, setStudentCredentials] = useState(null);
  const [teacherCredentials, setTeacherCredentials] = useState(null);
  const [adminActionMsg, setAdminActionMsg] = useState('');
  const [adminActionMsgIsError, setAdminActionMsgIsError] = useState(false);
  const [recordSearch, setRecordSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatus, setProjectStatus] = useState('All');
  const [adminLoadError, setAdminLoadError] = useState('');
  const [pendingSummary, setPendingSummary] = useState({ tasks: 0, invitations: 0 });
  const [recordStatus, setRecordStatus] = useState('All');
  const [recordSort, setRecordSort] = useState('name');

  const matchingStudents = students
    .filter((student) =>
      `${student.name || ''} ${student.rollNo || ''} ${student.userId?.username || ''}`
        .toLowerCase().includes(recordSearch.toLowerCase()),
    )
    .filter((student) => recordStatus === 'All' || student.userId?.status === recordStatus)
    .sort((first, second) => {
      if (recordSort === 'year') return (first.year || 0) - (second.year || 0);
      if (recordSort === 'rollNo') return (first.rollNo || '').localeCompare(second.rollNo || '');
      return (first.name || '').localeCompare(second.name || '');
    });
  const matchingTeachers = teachers
    .filter((teacher) =>
      `${teacher.name || ''} ${teacher.employeeId || ''} ${teacher.department || ''} ${teacher.userId?.username || ''}`
        .toLowerCase().includes(recordSearch.toLowerCase()),
    )
    .filter((teacher) => recordStatus === 'All' || teacher.userId?.status === recordStatus)
    .sort((first, second) => {
      if (recordSort === 'designation') return (first.designation || '').localeCompare(second.designation || '');
      return (first.name || '').localeCompare(second.name || '');
    });
  const matchingProjects = projects
    .filter((project) => {
      if (projectStatus === 'Archived') return !project.isActive;
      if (projectStatus === 'Active') return project.isActive;
      return projectStatus === 'All' || (project.isActive && project.status === projectStatus);
    })
    .filter((project) =>
      `${project.title || ''} ${project.description || ''} ${project.category || ''} ${(project.requiredSkills || []).join(' ')}`
        .toLowerCase().includes(projectSearch.toLowerCase()),
    )
    .sort((first, second) => first.title.localeCompare(second.title));
  const recentProjects = [...projects]
    .sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0))
    .slice(0, 3);

  const fetchAdminData = useCallback(async () => {
    const requests = [
      api.get('/api/admin/dashboard', { headers: getAuthHeaders() }),
      api.get('/api/admin/students', { headers: getAuthHeaders() }),
      api.get('/api/admin/teachers', { headers: getAuthHeaders() }),
      api.get('/api/admin/projects', {
        headers: getAuthHeaders(),
        params: section === 'projects' ? { includeArchived: 'true' } : undefined,
      }),
    ];
    if (section === 'dashboard') {
      requests.push(
        api.get('/api/tasks/all', { headers: getAuthHeaders() }),
        api.get('/api/invitations/all', { headers: getAuthHeaders() }),
      );
    }
    const [summaryRes, studentRes, teacherRes, projectRes, tasksRes, invitationsRes] = await Promise.all(requests);
    return { summaryRes, studentRes, teacherRes, projectRes, tasksRes, invitationsRes };
  }, [section]);

  const applyAdminData = useCallback(({ summaryRes, studentRes, teacherRes, projectRes, tasksRes, invitationsRes }) => {
    setAdminLoadError('');
    setStats(summaryRes.data || {});
    setStudents(studentRes.data?.data || []);
    setTeachers(teacherRes.data?.data || []);
    setProjects(projectRes.data?.data || []);
    if (tasksRes && invitationsRes) {
      setPendingSummary({
        tasks: (tasksRes.data?.data || []).filter((task) => task.status === 'Pending').length,
        invitations: (invitationsRes.data?.data || []).filter((invite) => invite.status === 'Pending').length,
      });
    }
  }, []);

  const loadAdminData = async () => {
    try {
      const responseData = await fetchAdminData();
      applyAdminData(responseData);
    } catch (error) {
      console.error('Admin dashboard load failed:', error);
      setAdminLoadError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchAdminData()
      .then((data) => {
        if (active) applyAdminData(data);
      })
      .catch((error) => {
        if (active) {
          console.error('Admin dashboard load failed:', error);
          setAdminLoadError(getErrorMessage(error));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [fetchAdminData, applyAdminData]);

  const handleCreateStudent = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setStudentMsg('');
    setStudentCredentials(null);
    try {
      const payload = {
        ...studentForm,
        skills: studentForm.skills
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        cgpa: Number(studentForm.cgpa),
        year: Number(studentForm.year),
      };

      const response = await api.post('/api/admin/student', payload, { headers: getAuthHeaders() });
      setStudentMsg('Student created successfully.');
      setStudentMsgIsError(false);
      setStudentCredentials(response.data?.credentials || null);
      setStudentForm(defaultStudentForm);
      await loadAdminData();
    } catch (error) {
      setStudentMsg(getErrorMessage(error));
      setStudentMsgIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTeacher = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setTeacherMsg('');
    setTeacherCredentials(null);
    try {
      const payload = {
        ...teacherForm,
        skills: teacherForm.skills
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        experience: Number(teacherForm.experience),
      };

      const response = await api.post('/api/admin/teacher', payload, { headers: getAuthHeaders() });
      setTeacherMsg('Teacher created successfully.');
      setTeacherMsgIsError(false);
      setTeacherCredentials(response.data?.credentials || null);
      setTeacherForm(defaultTeacherForm);
      await loadAdminData();
    } catch (error) {
      setTeacherMsg(getErrorMessage(error));
      setTeacherMsgIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setProjectMsg('');
    try {
      const payload = {
        ...projectForm,
        requiredSkills: projectForm.requiredSkills
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        teamSize: Number(projectForm.teamSize),
      };

      await api.post('/api/admin/project', payload, { headers: getAuthHeaders() });
      setProjectMsg('Project created successfully.');
      setProjectMsgIsError(false);
      setProjectForm(defaultProjectForm);
      await loadAdminData();
    } catch (error) {
      setProjectMsg(getErrorMessage(error));
      setProjectMsgIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStudent = async (student) => {
    setEditingRecord({ type: 'student', id: student._id });
    setEditForm({
      name: student.name || '',
      username: student.userId?.username || '',
      password: '',
      branch: student.branch || 'MCA',
      year: student.year || 1,
      skills: student.skills?.join(', ') || '',
      cgpa: student.cgpa ?? 0,
    });
  };

  const handleDeleteStudent = async (student) => {
    if (!window.confirm(`Delete student ${student.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/student/${student._id}`, { headers: getAuthHeaders() });
      setAdminActionMsg('Student deleted.');
      setAdminActionMsgIsError(false);
      loadAdminData();
    } catch (error) {
      setAdminActionMsg(getErrorMessage(error));
      setAdminActionMsgIsError(true);
    }
  };

  const handleEditTeacher = async (teacher) => {
    setEditingRecord({ type: 'teacher', id: teacher._id });
    setEditForm({
      name: teacher.name || '',
      username: teacher.userId?.username || '',
      password: '',
      department: teacher.department || 'MCA',
      designation: teacher.designation || '',
      skills: teacher.skills?.join(', ') || '',
      experience: teacher.experience ?? 0,
      email: teacher.email || '',
    });
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();
    if (!editingRecord || editSubmitting) return;
    setEditSubmitting(true);
    setAdminActionMsg('');
    const isStudent = editingRecord.type === 'student';
    const payload = {
      ...editForm,
      skills: editForm.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
    };
    if (isStudent) {
      payload.year = Number(editForm.year);
      payload.cgpa = Number(editForm.cgpa);
    } else {
      payload.experience = Number(editForm.experience);
    }
    try {
      await api.put(
        `/api/admin/${isStudent ? 'student' : 'teacher'}/${editingRecord.id}`,
        payload,
        { headers: getAuthHeaders() },
      );
      setEditingRecord(null);
      setAdminActionMsg(`${titleCase(editingRecord.type)} updated.`);
      setAdminActionMsgIsError(false);
      await loadAdminData();
    } catch (error) {
      setAdminActionMsg(getErrorMessage(error));
      setAdminActionMsgIsError(true);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (teacher) => {
    if (!window.confirm(`Delete teacher ${teacher.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/teacher/${teacher._id}`, { headers: getAuthHeaders() });
      setAdminActionMsg('Teacher deleted.');
      setAdminActionMsgIsError(false);
      loadAdminData();
    } catch (error) {
      setAdminActionMsg(getErrorMessage(error));
      setAdminActionMsgIsError(true);
    }
  };

  if (loading) {
    return (
      <div className="page-stack">
        <SkeletonGrid count={section === 'dashboard' ? 5 : 3} />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">{section === 'dashboard' ? 'Overview' : 'Management'}</p>
          <h2>{section === 'dashboard' ? 'Admin dashboard' : `${titleCase(section)} management`}</h2>
        </div>
      </header>

      {section === 'dashboard' && (
        <>
          <section className="stats-grid" aria-label="Platform statistics">
            {Object.entries(stats)
              .filter(([label]) => ['students', 'teachers', 'projects', 'tasks', 'invitations'].includes(label))
              .map(([label, value]) => (
                <div className="stat-card" key={label} data-stat={label}>
                  <span>{titleCase(label)}</span>
                  <strong>{value}</strong>
                </div>
              ))}
          </section>
          <section className="pending-summary">
            <article className="panel">
              <span className="eyebrow">Pending tasks</span>
              <strong>{pendingSummary.tasks}</strong>
              <NavLink to="/manage/tasks">Review tasks</NavLink>
            </article>
            <article className="panel">
              <span className="eyebrow">Pending invitations</span>
              <strong>{pendingSummary.invitations}</strong>
              <NavLink to="/manage/invitations">Review invitations</NavLink>
            </article>
          </section>
          <section className="panel">
            <div className="section-heading">
              <div>
                <h3>Recent projects</h3>
                <p>Active work across the platform.</p>
              </div>
              <NavLink className="secondary-btn small" to="/manage/projects">Manage projects</NavLink>
            </div>
            {projects.length ? (
              <div className="project-grid">
                {recentProjects.map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>
            ) : (
              <p className="empty-state">No active projects yet.</p>
            )}
          </section>
          <div className="quick-actions">
            <NavLink className="primary-btn" to="/manage/students">Add student</NavLink>
            <NavLink className="secondary-btn" to="/manage/teachers">Add teacher</NavLink>
            <NavLink className="secondary-btn" to="/manage/projects">Create project</NavLink>
          </div>
        </>
      )}

      {adminLoadError && <p className="message error">{adminLoadError}</p>}

      {(section === 'students' || section === 'teachers') && (
        <section className="panel">
          <div className="management-filters">
            <label className="search-control">
              <span>Search {section}</span>
              <input
                value={recordSearch}
                onChange={(event) => setRecordSearch(event.target.value)}
                placeholder={section === 'students' ? 'Name, roll number, or username' : 'Name, employee ID, department, or username'}
              />
            </label>
            <label className="search-control">
              <span>Account status</span>
              <select value={recordStatus} onChange={(event) => setRecordStatus(event.target.value)}>
                <option>All</option><option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="search-control">
              <span>Sort by</span>
              <select value={recordSort} onChange={(event) => setRecordSort(event.target.value)}>
                {section === 'students' ? (
                  <><option value="name">Name</option><option value="year">Year</option><option value="rollNo">Roll number</option></>
                ) : (
                  <><option value="name">Name</option><option value="designation">Designation</option></>
                )}
              </select>
            </label>
          </div>
          {section === 'students' ? (
          <>
          <h3>Students</h3>
          <ul className="list-panel">
            {matchingStudents.map((student) => (
              <li key={student._id}>
                <div>
                  <strong>{student.name}</strong>
                  <small>{student.rollNo} · {student.branch} · Year {student.year} · Username {student.userId?.username || 'unavailable'} · Account {student.userId?.status || 'status unavailable'}</small>
                </div>
                <div className="admin-row-actions">
                  <span>{student.year} yr</span>
                  <button type="button" className="secondary-btn small" onClick={() => handleEditStudent(student)}>Edit</button>
                  <button type="button" className="ghost-btn small" onClick={() => handleDeleteStudent(student)}>Delete</button>
                </div>
              </li>
            ))}
            {!matchingStudents.length && <li className="empty-state">No matching students.</li>}
          </ul>
          </>
          ) : (
          <>
          <h3>Teachers</h3>
          <ul className="list-panel">
            {matchingTeachers.map((teacher) => (
              <li key={teacher._id}>
                <div>
                  <strong>{teacher.name}</strong>
                  <small>{teacher.employeeId} · {teacher.department} · Username {teacher.userId?.username || 'unavailable'} · Account {teacher.userId?.status || 'status unavailable'}</small>
                </div>
                <div className="admin-row-actions">
                  <span>{teacher.designation}</span>
                  <button type="button" className="secondary-btn small" onClick={() => handleEditTeacher(teacher)}>Edit</button>
                  <button type="button" className="ghost-btn small" onClick={() => handleDeleteTeacher(teacher)}>Delete</button>
                </div>
              </li>
            ))}
            {!matchingTeachers.length && <li className="empty-state">No matching teachers.</li>}
          </ul>
          </>
          )}
        </section>
      )}
      {adminActionMsg && (
        <p className={`message ${adminActionMsgIsError ? 'error' : 'success'}`}>
          {adminActionMsg}
        </p>
      )}

      {section === 'students' && (
        <section className="panel">
          <h3>Create student</h3>
          <form className="stack-form" onSubmit={handleCreateStudent}>
            <input value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} placeholder="Student name" required />
            <input value={studentForm.rollNo} onChange={(e) => setStudentForm({ ...studentForm, rollNo: e.target.value })} placeholder="Roll number" required />
            <div className="inline-row">
              <input value={studentForm.username} onChange={(e) => setStudentForm({ ...studentForm, username: e.target.value })} placeholder="Login username (optional)" minLength="4" maxLength="20" autoComplete="username" />
              <input type="password" value={studentForm.password} onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })} placeholder="Login password (optional)" minLength="8" autoComplete="new-password" />
            </div>
            <small className="muted-text">Leave blank to generate login credentials automatically.</small>
            <div className="inline-row">
              <select value={studentForm.branch} onChange={(e) => setStudentForm({ ...studentForm, branch: e.target.value })}>
                <option value="MCA">MCA</option>
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="ME">ME</option>
                <option value="CE">CE</option>
              </select>
              <input type="number" min="1" max="3" value={studentForm.year} onChange={(e) => setStudentForm({ ...studentForm, year: Number(e.target.value) })} required />
            </div>
            <input value={studentForm.skills} onChange={(e) => setStudentForm({ ...studentForm, skills: e.target.value })} placeholder="Skills, comma separated" />
            <input type="number" step="0.1" min="0" max="10" value={studentForm.cgpa} onChange={(e) => setStudentForm({ ...studentForm, cgpa: Number(e.target.value) })} placeholder="CGPA" required />
            <button className="primary-btn" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Add student'}</button>
            {studentMsg && (
              <p className={`message ${studentMsgIsError ? 'error' : 'success'}`}>
                {studentMsg}
              </p>
            )}
            {studentCredentials && (
              <div className="credential-box">
                <div className="credential-box-row">
                  <span className="credential-label">Username</span>
                  <span className="credential-value">{studentCredentials.username}</span>
                </div>
                <div className="credential-box-row">
                  <span className="credential-label">Password</span>
                  <span className="credential-value">{studentCredentials.password}</span>
                </div>
              </div>
            )}
          </form>
        </section>
      )}

      {section === 'teachers' && (
        <section className="panel">
          <h3>Create teacher</h3>
          <form className="stack-form" onSubmit={handleCreateTeacher}>
            <input value={teacherForm.name} onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })} placeholder="Teacher name" required />
            <input value={teacherForm.employeeId} onChange={(e) => setTeacherForm({ ...teacherForm, employeeId: e.target.value })} placeholder="Employee ID" required />
            <div className="inline-row">
              <input value={teacherForm.username} onChange={(e) => setTeacherForm({ ...teacherForm, username: e.target.value })} placeholder="Login username (optional)" minLength="4" maxLength="20" autoComplete="username" />
              <input type="password" value={teacherForm.password} onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })} placeholder="Login password (optional)" minLength="8" autoComplete="new-password" />
            </div>
            <small className="muted-text">Leave blank to generate login credentials automatically.</small>
            <div className="inline-row">
              <select value={teacherForm.department} onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}>
                <option value="MCA">MCA</option>
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="ME">ME</option>
                <option value="CE">CE</option>
              </select>
              <input value={teacherForm.designation} onChange={(e) => setTeacherForm({ ...teacherForm, designation: e.target.value })} placeholder="Designation" required />
            </div>
            <input value={teacherForm.skills} onChange={(e) => setTeacherForm({ ...teacherForm, skills: e.target.value })} placeholder="Skills, comma separated" required />
            <input type="number" min="0" value={teacherForm.experience} onChange={(e) => setTeacherForm({ ...teacherForm, experience: Number(e.target.value) })} placeholder="Experience" required />
            <input type="email" value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} placeholder="Email" required />
            <button className="primary-btn" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Add teacher'}</button>
            {teacherMsg && <p className={`message ${teacherMsgIsError ? 'error' : 'success'}`}>{teacherMsg}</p>}
            {teacherCredentials && (
              <div className="credential-box">
                <div className="credential-box-row">
                  <span className="credential-label">Username</span>
                  <span className="credential-value">{teacherCredentials.username}</span>
                </div>
                <div className="credential-box-row">
                  <span className="credential-label">Password</span>
                  <span className="credential-value">{teacherCredentials.password}</span>
                </div>
              </div>
            )}
          </form>
        </section>
      )}

      {section === 'projects' && (
        <>
        <section className="panel">
          <h3>Create project</h3>
          <form className="stack-form" onSubmit={handleCreateProject}>
            <input value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} placeholder="Project title" required />
            <textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} placeholder="Project description" required />
            <input value={projectForm.category} onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })} placeholder="Category" required />
            <input value={projectForm.requiredSkills} onChange={(e) => setProjectForm({ ...projectForm, requiredSkills: e.target.value })} placeholder="Required skills, comma separated" required />
            <div className="inline-row">
              <input type="number" min="2" max="10" value={projectForm.teamSize} onChange={(e) => setProjectForm({ ...projectForm, teamSize: Number(e.target.value) })} required />
              <select value={projectForm.mentor} onChange={(e) => setProjectForm({ ...projectForm, mentor: e.target.value })} required>
                <option value="">Select project mentor</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name} ({teacher.department})
                  </option>
                ))}
              </select>
            </div>
            <div className="inline-row">
              <input type="date" value={projectForm.startDate} onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })} required />
              <input type="date" value={projectForm.endDate} onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })} required />
            </div>
            <button className="primary-btn" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Add project'}</button>
            {projectMsg && <p className={`message ${projectMsgIsError ? 'error' : 'success'}`}>{projectMsg}</p>}
          </form>
        </section>

        <section className="panel">
          <div className="management-filters">
            <label className="search-control">
              <span>Search projects</span>
              <input value={projectSearch} onChange={(event) => setProjectSearch(event.target.value)} placeholder="Title, category, or skill" />
            </label>
            <label className="search-control">
              <span>Project status</span>
              <select value={projectStatus} onChange={(event) => setProjectStatus(event.target.value)}>
                <option>All</option><option>Active</option><option>Archived</option>
                <option>Open</option><option>In Progress</option><option>Completed</option><option>On Hold</option>
              </select>
            </label>
          </div>
          <h3>Active projects</h3>
          {matchingProjects.length ? (
            <div className="project-grid">
              {matchingProjects.map((project) => <ProjectCard key={project._id} project={project} />)}
            </div>
          ) : (
            <p className="empty-state">{projects.length ? 'No projects match these filters.' : 'No active projects. Create the first one above.'}</p>
          )}
        </section>
        </>
      )}

      {editingRecord && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !editSubmitting) setEditingRecord(null);
        }}>
          <section className="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="edit-record-title">
            <div className="section-heading">
              <div><p className="eyebrow">Update record</p><h3 id="edit-record-title">Edit {editingRecord.type}</h3></div>
              <button className="ghost-btn small" type="button" disabled={editSubmitting} onClick={() => setEditingRecord(null)}>Close</button>
            </div>
            <form className="stack-form" onSubmit={handleSaveEdit}>
              <input value={editForm.name || ''} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} placeholder="Name" required />
              <div className="inline-row">
                <label className="form-field">
                  Login username
                  <input
                    value={editForm.username || ''}
                    onChange={(event) => setEditForm({ ...editForm, username: event.target.value })}
                    minLength="4"
                    maxLength="20"
                    autoComplete="username"
                    required
                  />
                </label>
                <label className="form-field">
                  New password
                  <input
                    type="password"
                    value={editForm.password || ''}
                    onChange={(event) => setEditForm({ ...editForm, password: event.target.value })}
                    minLength="8"
                    autoComplete="new-password"
                    placeholder="Leave blank to keep current password"
                  />
                </label>
              </div>
              {editingRecord.type === 'student' ? (
                <>
                  <div className="inline-row">
                    <select value={editForm.branch || 'MCA'} onChange={(event) => setEditForm({ ...editForm, branch: event.target.value })}>
                      {['MCA', 'CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE'].map((branch) => <option key={branch}>{branch}</option>)}
                    </select>
                    <input type="number" min="1" max="3" value={editForm.year ?? 1} onChange={(event) => setEditForm({ ...editForm, year: Number(event.target.value) })} required />
                  </div>
                  <input value={editForm.skills || ''} onChange={(event) => setEditForm({ ...editForm, skills: event.target.value })} placeholder="Skills, comma separated" />
                  <input type="number" min="0" max="10" step="0.1" value={editForm.cgpa ?? 0} onChange={(event) => setEditForm({ ...editForm, cgpa: Number(event.target.value) })} required />
                </>
              ) : (
                <>
                  <input value={editForm.employeeId || ''} onChange={(event) => setEditForm({ ...editForm, employeeId: event.target.value })} placeholder="Employee ID" required />
                  <div className="inline-row">
                    <select value={editForm.department || 'MCA'} onChange={(event) => setEditForm({ ...editForm, department: event.target.value })}>
                      {['MCA', 'CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE'].map((department) => <option key={department}>{department}</option>)}
                    </select>
                    <input value={editForm.designation || ''} onChange={(event) => setEditForm({ ...editForm, designation: event.target.value })} placeholder="Designation" required />
                  </div>
                  <input value={editForm.skills || ''} onChange={(event) => setEditForm({ ...editForm, skills: event.target.value })} placeholder="Skills, comma separated" />
                  <div className="inline-row">
                    <input type="number" min="0" value={editForm.experience ?? 0} onChange={(event) => setEditForm({ ...editForm, experience: Number(event.target.value) })} required />
                    <input type="email" value={editForm.email || ''} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} placeholder="Email" required />
                  </div>
                </>
              )}
              <button className="primary-btn" type="submit" disabled={editSubmitting}>{editSubmitting ? 'Saving…' : 'Save changes'}</button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function TaskManagementView({ user, showToast }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [savingTask, setSavingTask] = useState('');
  const canDelete = user.role === 'admin' || user.role === 'teacher';
  const taskEndpoint = user.role === 'admin' ? '/api/tasks/all' : '/api/tasks/my';

  const loadTasks = useCallback(async () => {
    try {
      const response = await api.get(taskEndpoint, { headers: getAuthHeaders() });
      setTasks(response.data?.data || []);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [taskEndpoint]);

  useEffect(() => {
    let active = true;
    api.get(taskEndpoint, { headers: getAuthHeaders() })
      .then((response) => {
        if (!active) return;
        setTasks(response.data?.data || []);
        setErrorMessage('');
      })
      .catch((error) => {
        if (active) setErrorMessage(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [loadTasks, taskEndpoint]);

  const visibleTasks = tasks.filter((task) => {
    const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
    const assigneeId = task.assignedTo?._id || '';
    const matchesAssignee = assigneeFilter === 'All' || assigneeId === assigneeFilter;
    const text = [
      task.title,
      task.projectId?.title,
      task.assignedTo?.name,
    ].filter(Boolean).join(' ').toLowerCase();
    return matchesStatus && matchesAssignee && text.includes(search.toLowerCase());
  });
  const assignees = [...new Map(tasks
    .filter((task) => task.assignedTo?._id)
    .map((task) => [task.assignedTo._id, task.assignedTo.name || 'Student'])).entries()];

  const updateTaskStatus = async (task, status) => {
    setSavingTask(task._id);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await api.put(`/api/tasks/${task._id}`, { status }, { headers: getAuthHeaders() });
      await loadTasks();
      setSuccessMessage('Task status updated.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSavingTask('');
    }
  };

  const deleteTask = async (task) => {
    if (!window.confirm(`Delete task "${task.title}"? This cannot be undone.`)) return;
    setSavingTask(task._id);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await api.delete(`/api/tasks/${task._id}`, { headers: getAuthHeaders() });
      await loadTasks();
      setSuccessMessage('Task deleted.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSavingTask('');
    }
  };

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Work tracking</p>
          <h2>{user.role === 'student' ? 'My tasks' : 'Task management'}</h2>
          <p className="muted-copy">
            {user.role === 'admin'
              ? 'Platform-wide task status and assignments.'
              : user.role === 'teacher'
                ? 'Tasks for projects you mentor. Open a project to add tasks.'
                : 'Tasks assigned to you. Update their status as work progresses.'}
          </p>
        </div>
      </header>
      {errorMessage && <p className="message error">{errorMessage}</p>}
      {successMessage && <p className="message success">{successMessage}</p>}
      <section className="panel">
        <div className="management-filters">
          <label className="search-control">
            <span>Search tasks</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Task, project, or student" />
          </label>
          <label className="search-control">
            <span>Assignee</span>
            <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}>
              <option value="All">All students</option>
              {assignees.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </label>
          <label className="search-control">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>All</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
          </label>
        </div>
        {loading ? <SkeletonGrid count={4} /> : visibleTasks.length ? (
          <div className="management-list">
            {visibleTasks.map((task) => (
              <article className="management-row" key={task._id}>
                <div className="management-primary">
                  <strong>{task.title}</strong>
                  <span>{task.projectId?.title || 'Project unavailable'}</span>
                  <span>{task.description}</span>
                  <small>
                    Assigned to {task.assignedTo?.name || 'Unassigned'}
                    {task.dueDate ? ` · Due ${new Date(task.dueDate).toLocaleDateString()}` : ''}
                    {task.createdAt ? ` · Assigned ${new Date(task.createdAt).toLocaleDateString()}` : ''}
                    {task.priority ? ` · ${task.priority} priority` : ''}
                    {task.createdByUser?.username
                      ? ` · Created by ${task.createdByUser.username}`
                      : task.assignedBy?.name
                        ? ` · Created by ${task.assignedBy.name}`
                        : ''}
                  </small>
                </div>
                <div className="management-actions">
                  {task.projectId?._id && (
                    <Link className="secondary-btn small" to={`/projects/${task.projectId._id}`}>Project</Link>
                  )}
                  <label className={`status-badge ${task.status === 'Completed' ? 'success' : task.status === 'In Progress' ? 'progress' : 'pending'}`}>
                    <span className="visually-hidden">Task status</span>
                    <select
                      value={task.status}
                      disabled={savingTask === task._id}
                      onChange={(event) => updateTaskStatus(task, event.target.value)}
                    >
                      <option>Pending</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                    </select>
                  </label>
                  {canDelete && (
                    <button
                      className="ghost-btn small"
                      type="button"
                      disabled={savingTask === task._id}
                      onClick={() => deleteTask(task)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">{tasks.length ? 'No tasks match these filters.' : 'No tasks are available yet.'}</p>
        )}
      </section>
    </section>
  );
}

function InvitationManagementView() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [status, setStatus] = useState('All');

  useEffect(() => {
    let active = true;
    api.get('/api/invitations/all', { headers: getAuthHeaders() })
      .then((response) => {
        if (active) setInvitations(response.data?.data || []);
      })
      .catch((error) => {
        if (active) setErrorMessage(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const visibleInvitations = invitations.filter((invite) => status === 'All' || invite.status === status);

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Collaboration</p>
          <h2>Invitation management</h2>
        </div>
      </header>
      {errorMessage && <p className="message error">{errorMessage}</p>}
      <section className="panel">
        <div className="section-heading">
          <div><h3>Project invitations</h3><p>Review invitation recipients and responses.</p></div>
          <label className="status-filter">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>All</option><option>Pending</option><option>Accepted</option><option>Rejected</option>
            </select>
          </label>
        </div>
        {loading ? <SkeletonGrid count={3} /> : visibleInvitations.length ? (
          <div className="management-list">
            {visibleInvitations.map((invite) => (
              <article className="management-row" key={invite._id}>
                <div className="management-primary">
                  <strong>{invite.projectId?.title || 'Project unavailable'}</strong>
                  <span>To {invite.receiver?.name || 'Student unavailable'} · {invite.receiver?.rollNo || 'No roll number'}</span>
                  <small>From {invite.sender?.username || 'Unknown'} · {new Date(invite.createdAt).toLocaleDateString()}</small>
                </div>
                <span className={`status-badge ${invite.status === 'Accepted' ? 'success' : invite.status === 'Rejected' ? 'danger' : 'pending'}`}>
                  {invite.status}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">{invitations.length ? 'No invitations match this status.' : 'No project invitations exist yet.'}</p>
        )}
      </section>
    </section>
  );
}

function StudentInvitationsView() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [updatingInvitation, setUpdatingInvitation] = useState('');
  const [updatingAction, setUpdatingAction] = useState('');
  const [invitationFilter, setInvitationFilter] = useState('All');

  const loadInvitations = useCallback(async () => {
    try {
      const response = await api.get('/api/invitations/my', { headers: getAuthHeaders() });
      setInvitations(response.data?.data || []);
      setErrorMessage('');
      return true;
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.get('/api/invitations/my', { headers: getAuthHeaders() })
      .then((response) => {
        if (active) {
          setInvitations(response.data?.data || []);
          setErrorMessage('');
        }
      })
      .catch((error) => {
        if (active) setErrorMessage(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const respond = async (invite, action) => {
    setUpdatingInvitation(invite._id);
    setUpdatingAction(action);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await api.put(`/api/invitations/${invite._id}/${action}`, {}, { headers: getAuthHeaders() });
      setInvitations((currentInvitations) => currentInvitations.map((current) =>
        current._id === invite._id
          ? { ...current, status: action === 'accept' ? 'Accepted' : 'Rejected' }
          : current,
      ));
      setSuccessMessage(response.data?.message || `Invitation ${action}ed.`);
      await loadInvitations();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setUpdatingInvitation('');
      setUpdatingAction('');
    }
  };

  return (
    <section className="page-stack">
      <header className="page-header"><div><p className="eyebrow">Collaboration</p><h2>Project invitations</h2></div></header>
      {errorMessage && <p className="message error">{errorMessage}</p>}
      {successMessage && <p className="message success">{successMessage}</p>}
      <section className="panel">
        <div className="section-heading">
          <div>
            <h3>Received invitations</h3>
            <p>Respond to pending invitations or review your invitation history.</p>
          </div>
          <label className="status-filter">
            <span>Show</span>
            <select value={invitationFilter} onChange={(event) => setInvitationFilter(event.target.value)}>
              <option value="Pending">Pending invitations</option>
              <option value="All">All invitations</option>
            </select>
          </label>
        </div>
        {loading ? <SkeletonGrid count={3} /> : errorMessage && !invitations.length ? null : (
          (invitationFilter === 'All'
            ? invitations
            : invitations.filter((invite) => invite.status === 'Pending')).length ? (
          <div className="management-list">
            {(invitationFilter === 'All'
              ? invitations
              : invitations.filter((invite) => invite.status === 'Pending')).map((invite) => (
              <article className="management-row" key={invite._id}>
                <div className="management-primary">
                  <strong>{invite.projectId?.title || 'Project invitation'}</strong>
                  <span>{invite.projectId?.description || invite.message || 'You have been invited to collaborate.'}</span>
                  <small>
                    Owner: {invite.projectId?.owner?.name || 'Unknown'}
                    {invite.sender?.username ? ` · Invited by ${invite.sender.username}` : ''}
                    {invite.createdAt ? ` · ${new Date(invite.createdAt).toLocaleDateString()}` : ''}
                  </small>
                  {invite.message && invite.projectId?.description && (
                    <small>Message: {invite.message}</small>
                  )}
                  {invite.projectId?.requiredSkills?.length > 0 && (
                    <div className="tags">
                      {invite.projectId.requiredSkills.map((skill) => <span className="chip" key={skill}>{skill}</span>)}
                    </div>
                  )}
                </div>
                <div className="management-actions">
                  <span className={`status-badge ${invite.status === 'Accepted' ? 'success' : invite.status === 'Rejected' ? 'danger' : 'pending'}`}>{invite.status}</span>
                  {invite.status === 'Pending' && (
                    <>
                      <button className="secondary-btn small" type="button" disabled={updatingInvitation === invite._id} onClick={() => respond(invite, 'accept')}>
                        {updatingInvitation === invite._id && updatingAction === 'accept' ? 'Accepting…' : 'Accept'}
                      </button>
                      <button className="ghost-btn small" type="button" disabled={updatingInvitation === invite._id} onClick={() => respond(invite, 'reject')}>
                        {updatingInvitation === invite._id && updatingAction === 'reject' ? 'Rejecting…' : 'Reject'}
                      </button>
                    </>
                  )}
                  {invite.status === 'Accepted' && invite.projectId?._id && invite.projectId?.isActive && (
                    <Link className="secondary-btn small" to={`/projects/${invite.projectId._id}`}>Open project</Link>
                  )}
                </div>
              </article>
            ))}
          </div>
          ) : (
            <p className="empty-state">
              {invitationFilter === 'Pending'
                ? 'You have no pending project invitations.'
                : 'You have not received any project invitations.'}
            </p>
          )
        )}
      </section>
    </section>
  );
}

function MemberProjectsView({ user }) {
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    const profileUrl = user.role === 'student' ? '/api/students/profile' : '/api/teachers/profile';
    Promise.all([
      api.get(profileUrl, { headers: getAuthHeaders() }),
      api.get('/api/projects', { headers: getAuthHeaders() }),
    ]).then(([profileResponse, projectResponse]) => {
      if (!active) return;
      setProfile(profileResponse.data?.data || null);
      setProjects(projectResponse.data?.data || []);
    }).catch((error) => {
      if (active) setErrorMessage(getErrorMessage(error));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [user.role]);

  const memberProjects = projects.filter((project) => {
    if (!profile) return false;
    if (user.role === 'teacher') {
      const mentorId = project.mentor?._id || project.mentor;
      return mentorId?.toString() === profile._id?.toString();
    }
    const ownerId = project.owner?._id || project.owner;
    return ownerId?.toString() === profile._id?.toString()
      || project.members?.some((member) => (member._id || member).toString() === profile._id?.toString());
  });

  return (
    <section className="page-stack">
      <header className="page-header"><div><p className="eyebrow">Projects</p><h2>My projects</h2></div></header>
      {errorMessage && <p className="message error">{errorMessage}</p>}
      {loading ? <SkeletonGrid count={3} /> : memberProjects.length ? (
        <div className="project-grid">
          {memberProjects.map((project) => <ProjectCard key={project._id} project={project} />)}
        </div>
      ) : <p className="empty-state panel">No projects are associated with your account yet.</p>}
    </section>
  );
}

function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [updatingInvitation, setUpdatingInvitation] = useState('');
  const [updatingInvitationAction, setUpdatingInvitationAction] = useState('');
  const [projectForm, setProjectForm] = useState(defaultProjectForm);
  const [projectMsg, setProjectMsg] = useState('');
  const [projectMsgIsError, setProjectMsgIsError] = useState(false);
  const [invitationMsg, setInvitationMsg] = useState('');
  const [invitationMsgIsError, setInvitationMsgIsError] = useState(false);

  const loadStudentData = useCallback(async () => {
    try {
      const [profileRes, projectRes, invitationRes, teacherRes] = await Promise.all([
        api.get('/api/students/profile', { headers: getAuthHeaders() }),
        api.get('/api/projects', { headers: getAuthHeaders() }),
        api.get('/api/invitations/my', { headers: getAuthHeaders() }),
        api.get('/api/teachers', { headers: getAuthHeaders() }),
      ]);

      setProfile(profileRes.data?.data || null);
      setProjects(projectRes.data?.data || []);
      setInvitations(invitationRes.data?.data || []);
      setTeachers(teacherRes.data?.data || []);
      setDashboardError('');
    } catch (error) {
      setDashboardError(getErrorMessage(error));
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(loadStudentData);
  }, [loadStudentData]);

  const visibleProjects = useMemo(() => {
    if (!profile) return [];
    return projects.filter((project) => {
      const profileId = profile._id?.toString();
      const ownerId = (project.owner?._id || project.owner)?.toString();
      const isOwner = ownerId === profileId;
      const isMember = project.members?.some(
        (member) => (member._id || member).toString() === profileId,
      );
      return isOwner || isMember;
    });
  }, [profile, projects]);
  const sortedInvitations = useMemo(
    () => [...invitations].sort((left, right) => {
      if (left.status === 'Pending' && right.status !== 'Pending') return -1;
      if (left.status !== 'Pending' && right.status === 'Pending') return 1;
      return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
    }),
    [invitations],
  );
  const pendingInvitationCount = invitations.filter((invite) => invite.status === 'Pending').length;

  const handleCreateProject = async (event) => {
    event.preventDefault();
    setProjectMsg('');
    try {
      const payload = {
        ...projectForm,
        requiredSkills: projectForm.requiredSkills
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        teamSize: Number(projectForm.teamSize),
      };

      await api.post('/api/projects', payload, { headers: getAuthHeaders() });
      setProjectMsg('Project created successfully.');
      setProjectMsgIsError(false);
      setProjectForm(defaultProjectForm);
      await loadStudentData();
    } catch (error) {
      setProjectMsg(getErrorMessage(error));
      setProjectMsgIsError(true);
    }
  };

  const handleResponse = async (invite, action) => {
    if (updatingInvitation) return;
    setInvitationMsg('');
    setInvitationMsgIsError(false);
    setUpdatingInvitation(invite._id);
    setUpdatingInvitationAction(action);
    try {
      const response = await api.put(`/api/invitations/${invite._id}/${action}`, {}, { headers: getAuthHeaders() });
      setInvitations((currentInvitations) => currentInvitations.map((current) =>
        current._id === invite._id
          ? { ...current, status: action === 'accept' ? 'Accepted' : 'Rejected' }
          : current,
      ));
      setInvitationMsg(response.data?.message || `Invitation ${action}ed.`);
      setInvitationMsgIsError(false);
      await loadStudentData();
    } catch (error) {
      setInvitationMsg(getErrorMessage(error));
      setInvitationMsgIsError(true);
    } finally {
      setUpdatingInvitation('');
      setUpdatingInvitationAction('');
    }
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Student panel</p>
          <h2>My workbench</h2>
        </div>
        <Link className="primary-btn dashboard-invitations-link" to="/manage/invitations">
          Project invitations
          <span className="invitation-count">{pendingInvitationCount}</span>
        </Link>
      </header>

      <section className="panel highlight student-invitations-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Collaboration</p>
            <h3>Project invitations</h3>
            <p className="muted-copy">
              {pendingInvitationCount
                ? `${pendingInvitationCount} invitation${pendingInvitationCount === 1 ? '' : 's'} waiting for your response.`
                : 'Review invitations and choose whether to join each project.'}
            </p>
          </div>
          <Link className="secondary-btn small" to="/manage/invitations">View all invitations</Link>
        </div>
        {dashboardError && <p className="message error">{dashboardError}</p>}
        {invitationMsg && (
          <p className={`message ${invitationMsgIsError ? 'error' : 'success'}`} role="status">
            {invitationMsg}
          </p>
        )}
        {dashboardLoading ? <p className="loading">Loading your invitations…</p> : invitations.length ? (
          <div className="management-list">
            {sortedInvitations.map((invite) => (
              <article className="management-row student-invitation-row" key={invite._id}>
                <div className="management-primary">
                  <strong>{invite.projectId?.title || 'Project invitation'}</strong>
                  <span>{invite.projectId?.description || invite.message || 'You have been invited to collaborate.'}</span>
                  <small>
                    Owner: {invite.projectId?.owner?.name || 'Unknown'}
                    {invite.sender?.username ? ` · Invited by ${invite.sender.username}` : ''}
                    {invite.createdAt ? ` · Received ${new Date(invite.createdAt).toLocaleDateString()}` : ''}
                  </small>
                </div>
                <div className="management-actions">
                  <span className={`status-badge ${invite.status === 'Accepted' ? 'success' : invite.status === 'Rejected' ? 'danger' : 'pending'}`}>
                    {invite.status}
                  </span>
                  {invite.status === 'Pending' && (
                    <>
                      <button
                        type="button"
                        className="secondary-btn small"
                        disabled={Boolean(updatingInvitation)}
                        onClick={() => handleResponse(invite, 'accept')}
                      >
                        {updatingInvitation === invite._id && updatingInvitationAction === 'accept' ? 'Accepting…' : 'Accept'}
                      </button>
                      <button
                        type="button"
                        className="ghost-btn small"
                        disabled={Boolean(updatingInvitation)}
                        onClick={() => handleResponse(invite, 'reject')}
                      >
                        {updatingInvitation === invite._id && updatingInvitationAction === 'reject' ? 'Rejecting…' : 'Reject'}
                      </button>
                    </>
                  )}
                  {invite.status === 'Accepted' && invite.projectId?._id && invite.projectId?.isActive && (
                    <Link className="secondary-btn small" to={`/projects/${invite.projectId._id}`}>Open project</Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            You have no project invitations yet. Project invitations from administrators or project owners will appear here.
          </p>
        )}
      </section>

      <section className="panel highlight">
        <h3>Profile</h3>
        {profile ? (
          <div className="profile-row">
            <div>
              <strong>{profile.name}</strong>
              <p>{profile.branch} • {profile.rollNo}</p>
            </div>
            <div className="tags">
              {profile.skills?.map((skill) => (
                <span key={skill} className="chip">{skill}</span>
              ))}
            </div>
          </div>
        ) : (
          <p>Loading profile…</p>
        )}
      </section>

      <section className="panel-grid">
        <div className="panel">
          <h3>Create a project</h3>
          <form className="stack-form" onSubmit={handleCreateProject}>
            <input value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} placeholder="Project title" required />
            <textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} placeholder="Project description" required />
            <input value={projectForm.category} onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })} placeholder="Category" required />
            <input value={projectForm.requiredSkills} onChange={(e) => setProjectForm({ ...projectForm, requiredSkills: e.target.value })} placeholder="Required skills, comma separated" required />
            <div className="inline-row">
              <input type="number" min="2" max="10" value={projectForm.teamSize} onChange={(e) => setProjectForm({ ...projectForm, teamSize: Number(e.target.value) })} required />
              <select value={projectForm.mentor} onChange={(e) => setProjectForm({ ...projectForm, mentor: e.target.value })} required>
                <option value="">Select project mentor</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name} ({teacher.department})
                  </option>
                ))}
              </select>
            </div>
            <div className="inline-row">
              <input type="date" value={projectForm.startDate} onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })} required />
              <input type="date" value={projectForm.endDate} onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })} required />
            </div>
            <button className="primary-btn" type="submit">Create project</button>
            {projectMsg && <p className={`message ${projectMsgIsError ? 'error' : 'success'}`}>{projectMsg}</p>}
          </form>
        </div>

      </section>

      <section className="panel">
        <h3>My projects</h3>
        {visibleProjects.length ? (
          <div className="project-grid">
            {visibleProjects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        ) : (
          <p>No projects yet.</p>
        )}
      </section>
    </div>
  );
}

function TeacherDashboard() {
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/api/teachers/profile', { headers: getAuthHeaders() }),
      api.get('/api/projects', { headers: getAuthHeaders() }),
    ]).then(([profileRes, projectRes]) => {
      if (!active) return;
      setProfile(profileRes.data?.data || null);
      setProjects(projectRes.data?.data || []);
    }).catch((error) => {
      if (active) console.error('Teacher dashboard load failed:', error);
    });
    return () => { active = false; };
  }, []);

  const mentorProjects = useMemo(() => {
    if (!profile) return [];
    return projects.filter((project) => project.mentor?._id?.toString() === profile._id?.toString());
  }, [profile, projects]);

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Mentor panel</p>
          <h2>Project oversight</h2>
        </div>
      </header>

      <section className="panel highlight">
        <h3>Mentor profile</h3>
        {profile ? (
          <div className="profile-row">
            <div>
              <strong>{profile.name}</strong>
              <p>{profile.department} • {profile.designation}</p>
            </div>
            <div className="tags">
              {profile.skills?.map((skill) => (
                <span key={skill} className="chip">{skill}</span>
              ))}
            </div>
          </div>
        ) : (
          <p>Loading profile…</p>
        )}
      </section>

      <section className="panel">
        <h3>Assigned projects</h3>
        {mentorProjects.length ? (
          <div className="project-grid">
            {mentorProjects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        ) : (
          <p>No mentor assignments yet.</p>
        )}
      </section>
    </div>
  );
}

function ProjectDetailView({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [projectLoadError, setProjectLoadError] = useState('');
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [projectStudents, setProjectStudents] = useState([]);
  const [invitationStudents, setInvitationStudents] = useState([]);
  const [invitationStudent, setInvitationStudent] = useState('');
  const [invitationMessage, setInvitationMessage] = useState('');
  const [sentInvitations, setSentInvitations] = useState([]);
  const [invitationSubmitting, setInvitationSubmitting] = useState(false);
  const [invitationFeedback, setInvitationFeedback] = useState('');
  const [invitationFeedbackIsError, setInvitationFeedbackIsError] = useState(false);
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [githubFeedback, setGithubFeedback] = useState('');
  const [projectEditForm, setProjectEditForm] = useState(null);
  const [projectFeedback, setProjectFeedback] = useState('');
  const [projectFeedbackIsError, setProjectFeedbackIsError] = useState(false);
  const [actionFeedback, setActionFeedback] = useState('');
  const [actionFeedbackIsError, setActionFeedbackIsError] = useState(false);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [folderForm, setFolderForm] = useState({ name: '', parentFolder: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [taskStatusFilter, setTaskStatusFilter] = useState('All');
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState('All');
  const [taskActionInProgress, setTaskActionInProgress] = useState('');
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'Medium',
    dueDate: '',
  });
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  const loadProjectData = useCallback(async () => {
    setProjectLoadError('');
    try {
      const requests = [
        api.get(`/api/projects/${id}`, { headers: getAuthHeaders() }),
        api.get(`/api/tasks/project/${id}`, { headers: getAuthHeaders() }),
        api.get(`/api/project-folders/${id}`, { headers: getAuthHeaders() }),
        api.get(`/api/project-files/project/${id}`, { headers: getAuthHeaders() }),
      ];

      if (user.role === 'student') {
        requests.push(api.get('/api/students/profile', { headers: getAuthHeaders() }));
      }

      const results = await Promise.all(requests);
      const projectRes = results[0];
      const taskRes = results[1];
      const folderRes = results[2];
      const fileRes = results[3];

      setProject(projectRes.data?.data || null);
      setTasks(taskRes.data?.data || []);
      setFolders(folderRes.data?.data || []);
      setFiles(fileRes.data?.data || []);
      setGithubRepoUrl(projectRes.data?.data?.githubRepoUrl || '');
      setProjectEditForm({
        title: projectRes.data?.data?.title || '',
        description: projectRes.data?.data?.description || '',
        category: projectRes.data?.data?.category || '',
        requiredSkills: (projectRes.data?.data?.requiredSkills || []).join(', '),
        teamSize: projectRes.data?.data?.teamSize || 2,
      });

      const loadedProject = projectRes.data?.data;
      const loadedStudentProfile =
        user.role === 'student' ? results[4]?.data?.data || null : null;

      if (user.role === 'student') {
        setStudentProfile(loadedStudentProfile);
      }

      const members = [
        ...(loadedProject?.owner ? [loadedProject.owner] : []),
        ...(loadedProject?.members || []),
      ];
      setProjectStudents(
        members.filter(
          (member, index) => members.findIndex((item) => item._id === member._id) === index,
        ),
      );

      const canInvite =
        (user.role === 'admin' && loadedProject?.projectType === 'Admin') ||
        (user.role === 'student' &&
          loadedProject?.projectType === 'Student' &&
          loadedStudentProfile?._id === loadedProject?.owner?._id);
      if (canInvite) {
        const [candidateRes, sentInvitationRes] = await Promise.all([
          api.get(`/api/invitations/project/${id}/candidates`, { headers: getAuthHeaders() }),
          api.get(`/api/invitations/project/${id}`, { headers: getAuthHeaders() }),
        ]);
        setInvitationStudents(candidateRes.data?.data || []);
        setSentInvitations(sentInvitationRes.data?.data || []);
      } else {
        setInvitationStudents([]);
        setSentInvitations([]);
      }

      const progressRes = await api.get(`/api/projects/${id}/progress`, {
        headers: getAuthHeaders(),
      });
      setProgress(progressRes.data?.data || null);
    } catch (error) {
      console.error('Project detail load failed:', error);
      setProjectLoadError(getErrorMessage(error));
    }
  }, [id, user.role]);

  useEffect(() => {
    if (!id) return undefined;
    let active = true;
    Promise.resolve().then(() => {
      if (active) return loadProjectData();
      return undefined;
    });
    return () => { active = false; };
  }, [id, loadProjectData]);

  const handleTaskChange = (field) => (event) => {
    setTaskForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSaveTask = async (event) => {
    event.preventDefault();
    if (user.role !== 'teacher' || taskSubmitting) return;

    setTaskSubmitting(true);
    setActionFeedback('');
    try {
      await api.post(
        '/api/tasks',
        { ...taskForm, projectId: id },
        { headers: getAuthHeaders() },
      );

      setTaskForm({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'Medium',
        dueDate: '',
      });
      setActionFeedback('Task created.');
      setActionFeedbackIsError(false);
      await loadProjectData();
    } catch (error) {
      setActionFeedback(getErrorMessage(error));
      setActionFeedbackIsError(true);
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleTaskStatusUpdate = async (taskId, status) => {
    if (taskActionInProgress) return;
    setTaskActionInProgress(taskId);
    setActionFeedback('');
    try {
      await api.put(
        `/api/tasks/${taskId}`,
        { status },
        { headers: getAuthHeaders() },
      );
      setActionFeedback('Task status updated.');
      setActionFeedbackIsError(false);
      await loadProjectData();
    } catch (error) {
      setActionFeedback(getErrorMessage(error));
      setActionFeedbackIsError(true);
    } finally {
      setTaskActionInProgress('');
    }
  };

  const handleTaskEdit = (task) => {
    setEditingTaskId(task._id);
    setEditingTask({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo?._id || '',
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
    });
  };

  const handleTaskEditChange = (field) => (event) => {
    setEditingTask((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSaveTaskEdit = async (event) => {
    event.preventDefault();
    if (taskActionInProgress) return;
    setTaskActionInProgress(editingTaskId);
    setActionFeedback('');
    try {
      await api.put(`/api/tasks/${editingTaskId}`, editingTask, {
        headers: getAuthHeaders(),
      });
      setEditingTaskId('');
      setEditingTask(null);
      setActionFeedback('Task updated.');
      setActionFeedbackIsError(false);
      await loadProjectData();
    } catch (error) {
      setActionFeedback(getErrorMessage(error));
      setActionFeedbackIsError(true);
    } finally {
      setTaskActionInProgress('');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    if (taskActionInProgress) return;
    setTaskActionInProgress(taskId);
    setActionFeedback('');
    try {
      await api.delete(`/api/tasks/${taskId}`, {
        headers: getAuthHeaders(),
      });
      setActionFeedback('Task deleted.');
      setActionFeedbackIsError(false);
      await loadProjectData();
    } catch (error) {
      setActionFeedback(getErrorMessage(error));
      setActionFeedbackIsError(true);
    } finally {
      setTaskActionInProgress('');
    }
  };

  const handleSendInvitation = async (event) => {
    event.preventDefault();
    if (invitationSubmitting) return;
    setInvitationSubmitting(true);
    setInvitationFeedback('');
    try {
      const response = await api.post(
        '/api/invitations',
        { projectId: id, studentId: invitationStudent, message: invitationMessage },
        { headers: getAuthHeaders() },
      );
      setInvitationFeedback(response.data?.message || 'Invitation sent.');
      setInvitationFeedbackIsError(false);
      setInvitationStudent('');
      setInvitationMessage('');
      const [candidates, sent] = await Promise.all([
        api.get(`/api/invitations/project/${id}/candidates`, { headers: getAuthHeaders() }),
        api.get(`/api/invitations/project/${id}`, { headers: getAuthHeaders() }),
      ]);
      setInvitationStudents(candidates.data?.data || []);
      setSentInvitations(sent.data?.data || []);
    } catch (error) {
      setInvitationFeedback(getErrorMessage(error));
      setInvitationFeedbackIsError(true);
    } finally {
      setInvitationSubmitting(false);
    }
  };

  const handleSaveGithubRepo = async (event) => {
    event.preventDefault();
    setGithubFeedback('');
    try {
      const response = await api.patch(
        `/api/projects/${id}/github`,
        { githubRepoUrl },
        { headers: getAuthHeaders() },
      );
      setGithubRepoUrl(response.data?.data?.githubRepoUrl || '');
      setGithubFeedback(response.data?.message || 'Repository link saved.');
    } catch (error) {
      setGithubFeedback(getErrorMessage(error));
    }
  };

  const handleProjectEditChange = (field) => (event) => {
    setProjectEditForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSaveProject = async (event) => {
    event.preventDefault();
    setProjectFeedback('');
    try {
      await api.patch(
        `/api/projects/${id}`,
        {
          ...projectEditForm,
          teamSize: Number(projectEditForm.teamSize),
          requiredSkills: projectEditForm.requiredSkills
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean),
        },
        { headers: getAuthHeaders() },
      );
      setProjectFeedback('Project details saved.');
      setProjectFeedbackIsError(false);
      loadProjectData();
    } catch (error) {
      setProjectFeedback(getErrorMessage(error));
      setProjectFeedbackIsError(true);
    }
  };

  const handleArchiveProject = async () => {
    if (!window.confirm('Archive this project? It will no longer appear in active project lists.')) return;
    setProjectFeedback('');
    try {
      await api.delete(`/api/projects/${id}`, { headers: getAuthHeaders() });
      navigate('/dashboard');
    } catch (error) {
      setProjectFeedback(getErrorMessage(error));
      setProjectFeedbackIsError(true);
    }
  };

  const handleCreateFolder = async (event) => {
    event.preventDefault();
    setActionFeedback('');
    try {
      await api.post(
        `/api/project-folders/${id}`,
        {
          name: folderForm.name,
          parentFolder: folderForm.parentFolder || null,
        },
        { headers: getAuthHeaders() },
      );

      setFolderForm({ name: '', parentFolder: '' });
      setActionFeedback('Folder created.');
      setActionFeedbackIsError(false);
      loadProjectData();
    } catch (error) {
      setActionFeedback(getErrorMessage(error));
      setActionFeedbackIsError(true);
    }
  };

  const handleUploadFile = async (event) => {
    event.preventDefault();
    if (!uploadFile) return;

    setActionFeedback('');
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('projectId', id);
      if (folderForm.parentFolder) {
        formData.append('folderId', folderForm.parentFolder);
      }

      await api.post('/api/project-files/upload', formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadFile(null);
      setActionFeedback('File uploaded.');
      setActionFeedbackIsError(false);
      loadProjectData();
    } catch (error) {
      setActionFeedback(getErrorMessage(error));
      setActionFeedbackIsError(true);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Delete this file? This cannot be undone.')) return;
    setActionFeedback('');
    try {
      await api.delete(`/api/project-files/${fileId}/project/${id}`, {
        headers: getAuthHeaders(),
      });
      setActionFeedback('File deleted.');
      setActionFeedbackIsError(false);
      loadProjectData();
    } catch (error) {
      setActionFeedback(getErrorMessage(error));
      setActionFeedbackIsError(true);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm('Delete this folder? This cannot be undone.')) return;
    setActionFeedback('');
    try {
      await api.delete(`/api/project-folders/${id}/${folderId}`, {
        headers: getAuthHeaders(),
      });
      setActionFeedback('Folder deleted.');
      setActionFeedbackIsError(false);
      loadProjectData();
    } catch (error) {
      setActionFeedback(getErrorMessage(error));
      setActionFeedbackIsError(true);
    }
  };

  if (!project) {
    return projectLoadError ? (
      <section className="page-stack">
        <p className="message error">{projectLoadError}</p>
        <button className="secondary-btn" type="button" onClick={loadProjectData}>Retry loading project</button>
      </section>
    ) : <div className="loading">Loading project details…</div>;
  }

  const canManageTaskStatus = user.role === 'teacher' || user.role === 'admin';
  const filteredProjectTasks = tasks.filter((task) => {
    const matchesStatus = taskStatusFilter === 'All' || task.status === taskStatusFilter;
    const matchesAssignee =
      taskAssigneeFilter === 'All' || task.assignedTo?._id === taskAssigneeFilter;
    return matchesStatus && matchesAssignee;
  });
  const canEditProject = user.role === 'admin' ||
    (user.role === 'student' && studentProfile?._id === project.owner?._id);
  const canInvite =
    (user.role === 'admin' && project.projectType === 'Admin') ||
    (user.role === 'student' && studentProfile?._id === project.owner?._id);
  const rootFolders = folders.filter((folder) => !folder.parentFolder);
  const childFolders = folders.filter((folder) => folder.parentFolder);

  return (
    <div className="page-stack">
      {projectLoadError && (
        <p className="message error">
          Project details could not be refreshed: {projectLoadError}
        </p>
      )}
      <header className="page-header split-row">
        <div>
          <p className="eyebrow">Project</p>
          <h2>{project.title}</h2>
        </div>
        <Link className="secondary-btn" to="/dashboard">Back</Link>
      </header>

      <section className="panel highlight">
        <div className="project-header-row">
          <div>
            <strong>{project.category}</strong>
            <p>{project.description}</p>
          </div>
          <span className="status-badge active">{project.status}</span>
        </div>

        <div className="meta-grid">
          <div>
            <span>Team size</span>
            <strong>{project.teamSize}</strong>
          </div>
          <div>
            <span>Owner</span>
            <strong>{project.owner?.name || 'Admin project'}</strong>
          </div>
          <div>
            <span>Mentor</span>
            <strong>{project.mentor?.name || 'Unassigned'}</strong>
          </div>
        </div>

        {progress && (
          <div className="progress-strip">
            <div>
              <span>Completion</span>
              <strong>{progress.progress || '0%'}</strong>
            </div>
            <div>
              <span>Completed tasks</span>
              <strong>{progress.completed || 0}</strong>
            </div>
            <div>
              <span>Total tasks</span>
              <strong>{progress.totalTasks || 0}</strong>
            </div>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h3>Project members</h3>
            <p className="muted-copy">Students who are part of this project team.</p>
          </div>
          <span className="status-badge active">{projectStudents.length} {projectStudents.length === 1 ? 'person' : 'people'}</span>
        </div>
        {projectStudents.length ? (
          <div className="management-list">
            {projectStudents.map((student) => {
              const isOwner = student._id?.toString() === project.owner?._id?.toString();
              return (
                <article className="management-row" key={student._id}>
                  <div className="management-primary">
                    <strong>{student.name}</strong>
                    <span>{[student.rollNo, student.branch, student.year].filter(Boolean).join(' · ')}</span>
                  </div>
                  <span className={`status-badge ${isOwner ? 'active' : 'success'}`}>
                    {isOwner ? 'Project owner' : 'Project member'}
                  </span>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="empty-state">No student members have joined this project yet.</p>
        )}
      </section>

      {canInvite && (
        <section className="panel">
          <h3>Invite a collaborator</h3>
          <form className="stack-form" onSubmit={handleSendInvitation}>
            <select
              value={invitationStudent}
              onChange={(event) => setInvitationStudent(event.target.value)}
              required
            >
              <option value="">Select a student to invite</option>
              {invitationStudents.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} — {student.rollNo} ({student.branch})
                </option>
              ))}
            </select>
            <input
              value={invitationMessage}
              onChange={(event) => setInvitationMessage(event.target.value)}
              placeholder="Invitation message (optional)"
              maxLength={300}
            />
            <button
              className="primary-btn"
              type="submit"
              disabled={!invitationStudents.length || invitationSubmitting}
            >
              {invitationSubmitting ? 'Sending…' : 'Send invitation'}
            </button>
          </form>
          {!invitationStudents.length && (
            <p className="muted-text">No eligible students are available to invite.</p>
          )}
          {invitationFeedback && (
            <p className={`message ${invitationFeedbackIsError ? 'error' : 'success'}`}>
              {invitationFeedback}
            </p>
          )}
          <h3 className="subsection-title">Sent invitations</h3>
          {sentInvitations.length ? (
            <ul className="list-panel">
              {sentInvitations.map((invite) => (
                <li key={invite._id}>
                  <div>
                    <strong>{invite.receiver?.name || 'Student unavailable'}</strong>
                    <small>                    {invite.receiver?.rollNo || ''} · {invite.createdAt ? new Date(invite.createdAt).toLocaleDateString() : ''}</small>
                  </div>
                  <span className={`status-badge ${invite.status === 'Accepted' ? 'success' : invite.status === 'Rejected' ? 'danger' : 'pending'}`}>
                    {invite.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No invitations have been sent for this project.</p>
          )}
        </section>
      )}

      {canEditProject && (
        <section className="panel">
          <h3>Manage project</h3>
          <form className="stack-form project-edit-form" onSubmit={handleSaveProject}>
            <input value={projectEditForm?.title || ''} onChange={handleProjectEditChange('title')} placeholder="Project title" required />
            <textarea value={projectEditForm?.description || ''} onChange={handleProjectEditChange('description')} placeholder="Project description" required />
            <div className="inline-row">
              <input value={projectEditForm?.category || ''} onChange={handleProjectEditChange('category')} placeholder="Category" required />
              <input type="number" min={Math.max(2, projectStudents.length)} max="10" value={projectEditForm?.teamSize || 2} onChange={handleProjectEditChange('teamSize')} required />
            </div>
            <input
              value={projectEditForm?.requiredSkills || ''}
              onChange={handleProjectEditChange('requiredSkills')}
              placeholder="Required skills, comma separated"
              required
            />
            <div className="action-row">
              <button className="primary-btn" type="submit">Save project details</button>
              <button className="ghost-btn" type="button" onClick={handleArchiveProject}>Archive project</button>
            </div>
          </form>
          {projectFeedback && (
            <p className={`message ${projectFeedbackIsError ? 'error' : 'success'}`}>
              {projectFeedback}
            </p>
          )}
          <h3 className="subsection-title">GitHub repository</h3>
          <form className="inline-row" onSubmit={handleSaveGithubRepo}>
            <input
              type="url"
              value={githubRepoUrl}
              onChange={(event) => setGithubRepoUrl(event.target.value)}
              placeholder="https://github.com/owner/repository"
            />
            <button className="primary-btn" type="submit">Save repository</button>
          </form>
          {project.githubRepoUrl && (
            <p><a href={project.githubRepoUrl} target="_blank" rel="noreferrer">Open repository</a></p>
          )}
          {githubFeedback && (
            <p className={`message ${githubFeedback.includes('valid GitHub') || githubFeedback.startsWith('Failed') ? 'error' : 'success'}`}>
              {githubFeedback}
            </p>
          )}
        </section>
      )}

      {actionFeedback && (
        <p className={`message ${actionFeedbackIsError ? 'error' : 'success'}`}>
          {actionFeedback}
        </p>
      )}

      {(user.role === 'teacher' || user.role === 'admin') && (
        <section className="panel">
          <h3>Create task</h3>
          <form className="task-form" onSubmit={handleSaveTask}>
            <input value={taskForm.title} onChange={handleTaskChange('title')} placeholder="Task title" required />
            <textarea value={taskForm.description} onChange={handleTaskChange('description')} placeholder="Task description" required />
            <div className="task-row">
              <select value={taskForm.assignedTo} onChange={handleTaskChange('assignedTo')} required>
                <option value="">Assign to a project student</option>
                {projectStudents.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name} — {student.rollNo}
                  </option>
                ))}
              </select>
              <select value={taskForm.priority} onChange={handleTaskChange('priority')}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <input type="date" min={project.startDate?.slice(0, 10)} max={project.endDate?.slice(0, 10)} value={taskForm.dueDate} onChange={handleTaskChange('dueDate')} required />
            </div>
            <button className="primary-btn" type="submit" disabled={!projectStudents.length || taskSubmitting}>
              {taskSubmitting ? 'Saving…' : 'Create task'}
            </button>
            {!projectStudents.length && <p className="muted-text">Invite or add a student to the project before assigning tasks.</p>}
          </form>
        </section>
      )}

      <section className="panel-grid two-up">
        <div className="panel">
          <h3>Create folder</h3>
          <form className="stack-form" onSubmit={handleCreateFolder}>
            <input
              value={folderForm.name}
              onChange={(event) => setFolderForm({ ...folderForm, name: event.target.value })}
              placeholder="Folder name"
              required
            />
            <select
              value={folderForm.parentFolder}
              onChange={(event) => setFolderForm({ ...folderForm, parentFolder: event.target.value })}
            >
              <option value="">Root folder</option>
              {folders.map((folder) => (
                <option key={folder._id} value={folder._id}>
                  {folder.name}
                </option>
              ))}
            </select>
            <button className="primary-btn" type="submit">Create folder</button>
          </form>
        </div>

        <div className="panel">
          <h3>Upload file</h3>
          <form className="stack-form" onSubmit={handleUploadFile}>
            <input
              type="file"
              onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
              required
            />
            <select
              value={folderForm.parentFolder}
              onChange={(event) => setFolderForm({ ...folderForm, parentFolder: event.target.value })}
            >
              <option value="">No folder</option>
              {folders.map((folder) => (
                <option key={folder._id} value={folder._id}>
                  {folder.name}
                </option>
              ))}
            </select>
            <button className="primary-btn" type="submit" disabled={!uploadFile}>
              Upload file
            </button>
          </form>
        </div>
      </section>

      <section className="panel-grid two-up">
        <div className="panel">
          <h3>Folders</h3>
          {rootFolders.length ? (
            <div className="folder-tree">
              {rootFolders.map((folder) => (
                <div className="folder-node" key={folder._id}>
                  <div className="folder-row">
                    <strong>{folder.name}</strong>
                    <button
                      type="button"
                      className="ghost-btn small"
                      onClick={() => handleDeleteFolder(folder._id)}
                    >
                      Delete
                    </button>
                  </div>
                  {childFolders.filter((child) => child.parentFolder === folder._id).length > 0 && (
                    <div className="folder-children">
                      {childFolders
                        .filter((child) => child.parentFolder === folder._id)
                        .map((child) => (
                          <div className="folder-row child" key={child._id}>
                            <span>{child.name}</span>
                            <button
                              type="button"
                              className="ghost-btn small"
                              onClick={() => handleDeleteFolder(child._id)}
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No folders yet.</p>
          )}
        </div>

        <div className="panel">
          <h3>Files</h3>
          {files.length ? (
            <ul className="list-panel files-panel">
              {files.map((file) => (
                <li key={file._id}>
                  <div>
                    <strong>{file.fileName}</strong>
                    <small>{file.fileType}</small>
                  </div>
                  <div className="file-actions">
                    <a href={file.fileUrl} target="_blank" rel="noreferrer" className="secondary-btn small">
                      Open
                    </a>
                    <button
                      type="button"
                      className="ghost-btn small"
                      onClick={() => handleDeleteFile(file._id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No uploaded files yet.</p>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h3>Tasks</h3>
            <p>Project task assignments and current progress.</p>
          </div>
        </div>
        <div className="management-filters">
          <label className="search-control">
            <span>Filter by status</span>
            <select value={taskStatusFilter} onChange={(event) => setTaskStatusFilter(event.target.value)}>
              <option>All</option><option>Pending</option><option>In Progress</option><option>Completed</option>
            </select>
          </label>
          <label className="search-control">
            <span>Filter by assignee</span>
            <select value={taskAssigneeFilter} onChange={(event) => setTaskAssigneeFilter(event.target.value)}>
              <option value="All">All project members</option>
              {projectStudents.map((student) => (
                <option key={student._id} value={student._id}>{student.name}</option>
              ))}
            </select>
          </label>
        </div>
        {tasks.length ? (
          <ul className="task-list">
            {filteredProjectTasks.map((task) => {
              const isMyTask =
                user.role === 'student' &&
                studentProfile &&
                task.assignedTo?._id === studentProfile._id;

              return (
                <li key={task._id}>
                  {editingTaskId === task._id ? (
                    <form className="task-edit-form" onSubmit={handleSaveTaskEdit}>
                      <input value={editingTask.title} onChange={handleTaskEditChange('title')} required />
                      <textarea value={editingTask.description} onChange={handleTaskEditChange('description')} required />
                      <div className="task-row">
                        <select value={editingTask.assignedTo} onChange={handleTaskEditChange('assignedTo')} required>
                          {projectStudents.map((student) => (
                            <option key={student._id} value={student._id}>
                              {student.name} — {student.rollNo}
                            </option>
                          ))}
                        </select>
                        <select value={editingTask.priority} onChange={handleTaskEditChange('priority')}>
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                        <input type="date" min={project.startDate?.slice(0, 10)} max={project.endDate?.slice(0, 10)} value={editingTask.dueDate} onChange={handleTaskEditChange('dueDate')} required />
                      </div>
                      <div className="action-row">
                        <button className="primary-btn small" type="submit" disabled={Boolean(taskActionInProgress)}>
                          {taskActionInProgress === task._id ? 'Saving…' : 'Save task'}
                        </button>
                        <button className="ghost-btn small" type="button" disabled={Boolean(taskActionInProgress)} onClick={() => setEditingTaskId('')}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <strong>{task.title}</strong>
                        <p>{task.description}</p>
                        <small>
                          Assigned to {task.assignedTo?.name || 'Unassigned'}
                          {task.createdAt ? ` · Added ${new Date(task.createdAt).toLocaleDateString()}` : ''}
                          {task.createdByUser?.username
                            ? ` · Created by ${task.createdByUser.username}`
                            : task.assignedBy?.name
                              ? ` · Mentor ${task.assignedBy.name}`
                              : ''}
                        </small>
                      </div>
                      <div className="task-meta">
                        <span className={`status-badge ${task.status === 'Completed' ? 'success' : task.status === 'In Progress' ? 'progress' : 'pending'}`}>
                          {task.status}
                        </span>
                        {task.priority && <small>{task.priority} priority</small>}
                        <small>Due {new Date(task.dueDate).toLocaleDateString()}</small>
                        {(canManageTaskStatus || isMyTask) && (
                          <select
                            className="inline-select"
                            value={task.status}
                            disabled={Boolean(taskActionInProgress)}
                            onChange={(event) => handleTaskStatusUpdate(task._id, event.target.value)}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        )}
                        {user.role === 'student' && !isMyTask && (
                          <small className="muted-text">Not assigned to you</small>
                        )}
                        {(user.role === 'teacher' || user.role === 'admin') && (
                          <div className="action-row">
                            <button type="button" className="secondary-btn small" disabled={Boolean(taskActionInProgress)} onClick={() => handleTaskEdit(task)}>Edit</button>
                            <button type="button" className="ghost-btn small" disabled={Boolean(taskActionInProgress)} onClick={() => handleDeleteTask(task._id)}>Delete</button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p>{user.role === 'student' ? 'No tasks are assigned to you in this project.' : 'No tasks have been created for this project yet.'}</p>
        )}
        {tasks.length > 0 && !filteredProjectTasks.length && (
          <p className="empty-state">No tasks match the selected filters.</p>
        )}
      </section>
    </div>
  );
}

const PROJECT_STATUS_CLASS = {
  Open: 'open',
  'In Progress': 'progress',
  Completed: 'success',
  'On Hold': 'warning',
};

function ProjectCard({ project }) {
  const archived = project.isActive === false;
  const statusClass = PROJECT_STATUS_CLASS[project.status];
  const members = project.members || [];
  const teamCount = members.length + (project.owner ? 1 : 0);

  return (
    <article className={`project-card${statusClass && !archived ? ` project-card--${statusClass}` : ''}`}>
      <div className="project-card-header">
        <div>
          <strong>{project.title}</strong>
          <small>{project.category}</small>
        </div>
        <span className={`status-badge ${archived ? 'danger' : statusClass || 'active'}`}>
          {archived ? 'Archived' : project.status}
        </span>
      </div>

      <p className="project-card-desc">{project.description}</p>

      <div className="tags">
        {project.requiredSkills?.map((skill) => (
          <span key={skill} className="chip">{skill}</span>
        ))}
      </div>

      <div className="project-metadata">
        <span>Mentor: {project.mentor?.name || 'Not assigned'}</span>
        <span>Owner: {project.owner?.name || 'Admin-managed'}</span>
        <span>
          Members: {members.length
            ? members.slice(0, 4).map((member) => member.name).filter(Boolean).join(', ')
            : 'None yet'}
          {members.length > 4 ? ` +${members.length - 4}` : ''}
        </span>
      </div>

      <div className="project-card-footer">
        <span>{teamCount}/{project.teamSize} team members</span>
        {archived
          ? <span className="muted-text">Archived project</span>
          : <Link className="secondary-btn small" to={`/projects/${project._id}`}>Open</Link>}
      </div>
    </article>
  );
}
export default App;