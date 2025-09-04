import React, { useState, useEffect, useCallback } from 'react';
import { User, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

// ProfileSettings component moved outside to prevent re-creation
const ProfileSettings = ({ 
  profileData, 
  onInputChange, 
  onSave 
}: {
  profileData: { firstName: string; lastName: string; email: string; username: string; currency: string; dateFormat: string };
  onInputChange: (field: string, value: string) => void;
  onSave: () => void;
}) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            value={profileData.username}
            onChange={(e) => onInputChange('username', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email (optional)</label>
          <input
            type="email"
            value={profileData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">First Name</label>
          <input
            type="text"
            value={profileData.firstName}
            onChange={(e) => onInputChange('firstName', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <input
            type="text"
            value={profileData.lastName}
            onChange={(e) => onInputChange('lastName', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>

    <button 
      onClick={onSave}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      Save Changes
    </button>
  </div>
);

// SecuritySettings component moved outside to prevent re-creation
const SecuritySettings = ({ 
  securityData, 
  setSecurityData, 
  showCurrentPassword, 
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmNewPassword,
  setShowConfirmNewPassword 
}: {
  securityData: { currentPassword: string; newPassword: string; confirmNewPassword: string };
  setSecurityData: React.Dispatch<React.SetStateAction<{ currentPassword: string; newPassword: string; confirmNewPassword: string }>>;
  showCurrentPassword: boolean;
  setShowCurrentPassword: (show: boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (show: boolean) => void;
  showConfirmNewPassword: boolean;
  setShowConfirmNewPassword: (show: boolean) => void;
}) => {
  
  const handleUpdatePassword = async () => {
    // Validation
    if (!securityData.currentPassword) {
      alert('Please enter your current password');
      return;
    }
    
    if (!securityData.newPassword) {
      alert('Please enter a new password');
      return;
    }
    
    if (securityData.newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }
    
    if (securityData.newPassword !== securityData.confirmNewPassword) {
      alert('New password and confirmation do not match');
      return;
    }
    
    try {
      // Call the real API to update the password
      const response = await apiService.updatePassword(
        securityData.currentPassword,
        securityData.newPassword
      );
      
      alert('Password updated successfully! You can now use your new password to log in.');
      
      // Clear the form
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
      
    } catch (error) {
      console.error('Password update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update password. Please try again.';
      alert(errorMessage);
    }
  };

  return (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Password</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Current Password</label>
          <div className="mt-1 relative">
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={securityData.currentPassword}
              onChange={(e) => {
                console.log('Current password change:', e.target.value);
                setSecurityData(prev => ({
                  ...prev,
                  currentPassword: e.target.value
                }));
              }}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter current password"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center z-20 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowCurrentPassword(!showCurrentPassword);
              }}
            >
              {showCurrentPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">New Password</label>
          <div className="mt-1 relative">
            <input
              type={showNewPassword ? "text" : "password"}
              value={securityData.newPassword}
              onChange={(e) => {
                console.log('New password change:', e.target.value);
                setSecurityData(prev => ({
                  ...prev,
                  newPassword: e.target.value
                }));
              }}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter new password"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center z-20 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowNewPassword(!showNewPassword);
              }}
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
          <div className="mt-1 relative">
            <input
              type={showConfirmNewPassword ? "text" : "password"}
              value={securityData.confirmNewPassword}
              onChange={(e) => {
                console.log('Confirm password change:', e.target.value);
                setSecurityData(prev => ({
                  ...prev,
                  confirmNewPassword: e.target.value
                }));
              }}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center z-20 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowConfirmNewPassword(!showConfirmNewPassword);
              }}
            >
              {showConfirmNewPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>


    <button 
      onClick={handleUpdatePassword}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Update Security
    </button>
  </div>
  );
};

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    currency: 'MYR',
    dateFormat: 'DD/MM/YYYY'
  });
  
  // Password visibility states for security settings
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  
  // Security form data
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  // Load user data when component mounts or user changes
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        username: user.username || ''
      }));
    }
  }, [user]);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Shield },
  ];

  const handleProfileSave = useCallback(async () => {
    try {
      // Prepare data in backend format (snake_case)
      const updateData = {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
        username: profileData.username
      };

      console.log('Saving profile data:', updateData);
      
      const response = await apiService.updateProfile(updateData);
      
      // Update user context with new data
      if (user) {
        user.first_name = response.user.first_name;
        user.last_name = response.user.last_name;
        user.email = response.user.email;
        user.username = response.user.username;
      }

      alert('Profile settings saved successfully!');
      
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  }, [profileData, user]);

  const handleInputChange = useCallback((field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSecurityInputChange = useCallback((field: string, value: string) => {
    setSecurityData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);





  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ProfileSettings
            profileData={profileData}
            onInputChange={handleInputChange}
            onSave={handleProfileSave}
          />
        );
      case 'security':
        return (
          <SecuritySettings
            securityData={securityData}
            setSecurityData={setSecurityData}
            showCurrentPassword={showCurrentPassword}
            setShowCurrentPassword={setShowCurrentPassword}
            showNewPassword={showNewPassword}
            setShowNewPassword={setShowNewPassword}
            showConfirmNewPassword={showConfirmNewPassword}
            setShowConfirmNewPassword={setShowConfirmNewPassword}
          />
        );
      default:
        return (
          <ProfileSettings
            profileData={profileData}
            onInputChange={handleInputChange}
            onSave={handleProfileSave}
          />
        );
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm">
        <nav className="mt-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium text-left hover:bg-gray-50 ${
                activeTab === tab.id
                  ? 'border-r-2 border-blue-500 bg-blue-50 text-blue-700'
                  : 'text-gray-600'
              }`}
            >
              <tab.icon className="mr-3 h-5 w-5" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-8">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">
            {tabs.find(tab => tab.id === activeTab)?.name}
          </h1>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;