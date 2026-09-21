// src/context/AccountContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getUserProfile, updateUserProfileData, uploadUserAvatar } from '../data/user';
import { getOrders } from '../data/orders';

const AccountContext = createContext(null);

export const AccountProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadAccountData() {
      try {
        const [userData, ordersData] = await Promise.all([
          getUserProfile(),
          getOrders(),
        ]);
        if (isMounted) {
          setProfile(userData);
          setOrders(ordersData);
        }
      } catch (err) {
        console.error('Failed to load account context data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadAccountData();
    return () => {
      isMounted = false;
    };
  }, []);

  const updateProfile = async (fields) => {
    const updated = await updateUserProfileData(fields);
    setProfile(updated);
    return updated;
  };

  const uploadAvatar = async (file) => {
    const res = await uploadUserAvatar(file);
    setProfile((prev) => ({ ...prev, profilePicture: res.profilePicture }));
    return res.profilePicture;
  };

  const orderCount = useMemo(() => orders.length, [orders]);

  const totalSpent = useMemo(() => {
    return orders
      .filter((order) => order.status === 'delivered')
      .reduce((sum, order) => sum + order.totalAmount, 0);
  }, [orders]);

  return (
    <AccountContext.Provider
      value={{
        profile,
        orders,
        loading,
        updateProfile,
        uploadAvatar,
        orderCount,
        totalSpent,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};