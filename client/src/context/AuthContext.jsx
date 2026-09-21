// ไฟล์: client/src/context/AuthContext.jsx
// Context จัดการสถานะ Authentication และสิทธิ์ผู้ใช้งาน (Admin / Customer)
// เรียกมาจาก: App.jsx (นำ AuthProvider ไปครอบทั้งแอป)
// แหล่งข้อมูลผู้ใช้: รองรับทั้ง backend API (/api/auth) และ fallback ระบบ mockup (src/data/mockup/mockUsers.js)
// ส่งออก Hook: useAuth() สำหรับหน้า Login, Register, Navbar, UserDashboard, AdminDashboard
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  authenticate,
  getUsers,
  getUserById,
  saveRegisteredUser,
} from '../data/mockup/mockUsers';
import {
  saveSession,
  getSession,
  clearSession,
} from '../utils/sessionStorage';
import { registerApi, loginApi, logoutApi, checkAuthApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // ดึง session เริ่มต้นจาก sessionStorage (ถ้ามี)
  const [user, setUser] = useState(() => getSession());

  // booting = ช่วงเปิดเว็บที่กำลังถาม server ว่า login ค้างไว้ไหม
  // ระหว่างรอ user ยังเป็น null อยู่ ProtectedRoute ต้องรอก่อน ไม่งั้นเด้ง /login ทั้งที่ login ไว้แล้ว
  const [booting, setBooting] = useState(true);

  // ตรวจสอบ authentication session กับเซิร์ฟเวอร์ backend เมื่อ mount
  useEffect(() => {
    checkAuthApi()
      .then((result) => {
        if (result.success && result.user) {
          saveSession(result.user);
          setUser(result.user);
        }
      })
      .catch(() => {
        // ออฟไลน์หรือยังไม่ต่อ backend ให้ใช้ session เดิม
      })
      .finally(() => setBooting(false));
  }, []);

  // ฟังก์ชัน login: พยายามต่อ backend API ก่อน ถ้าต่อไม่ติดหรือ 404 ให้ fallback ไปเช็คกับ mockup database
  // คืน { success, message?, user? } เสมอ เพื่อให้ฟอร์มอ่าน result.success / result.message ได้ตรงกันทั้งสองเส้นทาง
  const login = useCallback(async (email, password) => {
    try {
      const apiResult = await loginApi(email, password);
      if (apiResult.success && apiResult.user) {
        saveSession(apiResult.user);
        setUser(apiResult.user);
        return apiResult;
      }
      // ถ้า backend ตอบกลับมาและมีข้อความปฏิเสธจริง (ไม่ใช่ 404 endpoint not found)
      if (apiResult.status && apiResult.status !== 404 && apiResult.message) {
        // ตรวจสอบก่อนว่าอาจเป็น mock user หรือไม่ ถ้าใช่ให้เข้าสู่ระบบผ่าน mock
        const authed = authenticate(email, password);
        if (authed) {
          const { password: _pw, ...safeUser } = authed;
          saveSession(safeUser);
          setUser(safeUser);
          return { success: true, message: 'Login successful', user: safeUser };
        }
        return apiResult;
      }
    } catch {
      // ถ้า backend ไม่ตอบสนอง ให้ fallback ไปเช็ค mockUsers
    }

    const authed = authenticate(email, password);
    if (authed) {
      const { password: _pw, ...safeUser } = authed;
      saveSession(safeUser);
      setUser(safeUser);
      return { success: true, message: 'Login successful', user: safeUser };
    }
    return { success: false, message: 'Invalid email or password' };
  }, []);

  // ฟังก์ชัน register: สมัครสมาชิกผ่าน backend API (ถ้าไม่มี backend ให้ fallback บันทึกลง session)
  const register = useCallback(async ({ username, email, password, phone }) => {
    const newUserWithPassword = {
      _id: `usr-${Date.now()}`,
      email,
      password,
      firstName: username || 'User',
      lastName: '',
      phone: phone || '',
      role: 'customer',
      memberSince: new Date().toISOString().split('T')[0],
    };

    try {
      const apiResult = await registerApi({
        email,
        password,
        firstName: username || '',
        phone: phone || '',
      });
      if (apiResult.success) {
        saveRegisteredUser({
          ...newUserWithPassword,
          _id: apiResult.user?._id || newUserWithPassword._id,
        });
        return apiResult;
      }
      if (apiResult.status && apiResult.status !== 404 && apiResult.message) {
        return apiResult;
      }
    } catch {
      // fallback
    }

    saveRegisteredUser(newUserWithPassword);
    const { password: _pw, ...safeUser } = newUserWithPassword;
    saveSession(safeUser);
    setUser(safeUser);
    return { success: true, message: 'Registration successful', user: safeUser };
  }, []);

  // ฟังก์ชัน logout: แจ้ง backend และล้าง session ในเครื่อง
  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // ignore
    }
    clearSession();
    setUser(null);
  }, []);

  // ฟังก์ชันรีเซ็ตรหัสผ่าน (mock endpoint)
  const resetPassword = useCallback((email, newPassword) => {
    return { success: true, message: 'Password updated successfully' };
  }, []);

  // ฟังก์ชัน refresh ข้อมูล user
  const refreshUser = useCallback((userId) => {
    const fresh = getUserById(userId);
    if (fresh) {
      const safeUser = { ...fresh };
      delete safeUser.password;
      saveSession(safeUser);
      setUser(safeUser);
    }
  }, []);

  const updateCurrentUser = useCallback((updatedUser) => {
    if (!updatedUser) return;
    saveSession(updatedUser);
    setUser(updatedUser);
  }, []);

  // รวม state และ helper สำหรับเช็คสิทธิ์ (Admin / Customer) ให้เรียกใช้ง่ายๆ
  // isLoggedIn = ชื่อเรียกตรงตัวสำหรับ ProtectedRoute (ค่าเดียวกับ isAuthenticated)
  const value = useMemo(
    () => ({
      user,
      isLoggedIn: Boolean(user),
      booting,
      isAuthenticated: Boolean(user),
      isAdmin: Boolean(user && user.role === 'admin'),
      isCustomer: Boolean(user && user.role === 'customer'),
      users: getUsers(),
      login,
      register,
      logout,
      resetPassword,
      refreshUser,
      updateCurrentUser,
    }),
    [user, booting, login, register, logout, resetPassword, refreshUser, updateCurrentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook สำหรับดึง context การล็อกอินไปใช้ในหน้าอื่นๆ
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
