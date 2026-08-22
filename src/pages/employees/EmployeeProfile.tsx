import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Calendar,
  Camera,
  Save,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';

export const EmployeeProfile: React.FC = () => {
  const { user, employee, updateEmployeeProfile } = useAuth();
  const { showToast } = useToast();

  const [phone, setPhone] = useState(employee?.phone || '');
  const [address, setAddress] = useState(employee?.address || '');
  const [photo, setPhoto] = useState(employee?.photo || '');
  const [isSaving, setIsSaving] = useState(false);

  // Avatar presets for quick photo changes
  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateEmployeeProfile({
        phone,
        address,
        photo,
      });
      showToast({
        title: 'Profile Updated',
        message: 'Your contact details and avatar were saved successfully.',
        variant: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Save Failed',
        message: err.response?.data?.error || 'Unable to update profile.',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Profile & Preferences</h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your personal contact details, residential address, and profile photo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={employee?.status || 'Active'} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Photo Card & Fixed Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs text-center">
            <div className="relative w-28 h-28 mx-auto mb-4 group">
              <img
                src={
                  photo ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    employee?.firstName || 'User'
                  )}&background=4A1F45&color=fff`
                }
                alt="Profile Avatar"
                className="w-full h-full rounded-2xl object-cover border-2 border-[#6F3C68] shadow-md"
              />
              <label
                htmlFor="photo-upload"
                className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[11px] font-semibold"
              >
                <Camera className="w-5 h-5 mb-1" />
                Change
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <h3 className="text-base font-bold text-gray-900 leading-tight">
              {employee?.firstName} {employee?.lastName}
            </h3>
            <p className="text-xs text-[#4A1F45] font-semibold mt-0.5">{employee?.designation}</p>
            <p className="text-[11px] text-gray-500 font-mono mt-1">{employee?.employeeCode}</p>

            {/* Quick Avatar Presets */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Preset Avatars</p>
              <div className="flex justify-center gap-1.5 flex-wrap">
                {avatarPresets.map((preset, idx) => (
                  <img
                    key={idx}
                    src={preset}
                    onClick={() => setPhoto(preset)}
                    className={`w-7 h-7 rounded-lg object-cover cursor-pointer transition-transform hover:scale-110 border ${
                      photo === preset ? 'border-[#4A1F45] ring-2 ring-[#4A1F45]/30' : 'border-gray-200'
                    }`}
                    alt={`preset ${idx}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Read-Only Organizational Metadata */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-3 text-xs">
            <span className="font-bold text-gray-900 uppercase tracking-wider block text-[11px]">
              Organizational Record
            </span>
            <div className="flex items-center gap-2 text-gray-700">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span>{employee?.department}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Briefcase className="w-4 h-4 text-gray-400" />
              <span>{employee?.designation}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Joined on {employee?.joiningDate}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Shield className="w-4 h-4 text-gray-400" />
              <span className="capitalize">{user?.role} Access Rights</span>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Profile Form */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs">
          <h3 className="text-base font-bold text-gray-900 mb-1">Contact & Residential Details</h3>
          <p className="text-xs text-gray-500 mb-6">
            Keep your official phone number and home address updated for HR correspondence.
          </p>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Official Email Address"
                value={employee?.email || user?.email}
                disabled
                hint="Managed by Dayflow IT administration"
                leftIcon={<Mail className="w-4 h-4" />}
              />
              <Input
                label="Primary Contact Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98000 00000"
                leftIcon={<Phone className="w-4 h-4" />}
                required
              />
            </div>

            <div className="w-full flex flex-col gap-1.5 text-left">
              <label className="block text-xs font-semibold text-gray-700">Residential Address</label>
              <div className="relative">
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, apartment / building, city, state, postal code..."
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:border-[#6F3C68] focus:ring-2 focus:ring-[#6F3C68]/20 outline-none resize-none"
                />
              </div>
            </div>

            <Input
              label="Direct Photo URL (Optional)"
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              placeholder="https://..."
              hint="Paste a direct image link or choose a preset on the left"
            />

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Profile Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
