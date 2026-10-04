import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Upload, FileText, CheckCircle2, 
  Clock, Camera, User, Phone, Save, Cloud, AlertCircle 
} from 'lucide-react';
import { Driver, DocumentItem } from '../../types';
import { authService } from '../../services/auth';
import { driversService } from '../../services/drivers';
import { storageService } from '../../services/storage';

export const DriverProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [driver, setDriver] = useState<Driver | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [description, setDescription] = useState('');
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const state = authService.getAuthState();
    if (!state.isDriverAuthenticated || !state.driver) {
      navigate('/driver/login');
      return;
    }
    const current = driversService.getDriverById(state.driver.id) || state.driver;
    setDriver(current);
    setName(current.name);
    setPhone(current.phone);
    setArea(current.area);
    setExperienceYears(current.experienceYears);
    setDescription(current.description);
  }, []);

  if (!driver) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = driversService.updateProfile(driver.id, {
      name,
      phone,
      area,
      experienceYears,
      description,
    });
    if (updated) {
      setDriver(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Simulate Cloudflare R2 Upload
  const handleDocumentUpload = async (docType: DocumentItem['type'], file: File) => {
    setUploadingDocType(docType);
    try {
      const res = await storageService.uploadFile(file, 'driver-documents');
      
      const updatedDocs = driver.documents.map(doc => {
        if (doc.type === docType) {
          return {
            ...doc,
            status: 'Verified' as const,
            url: res.url,
            uploadedAt: new Date().toISOString().split('T')[0],
          };
        }
        return doc;
      });

      const updated = driversService.updateProfile(driver.id, { documents: updatedDocs });
      if (updated) setDriver(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingDocType(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Driver Profile & Documents</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your partner profile, verification credentials, and Cloudflare R2 documents.
        </p>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Profile updated successfully!
        </div>
      )}

      {/* Main Profile Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft mb-8">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="relative">
            <img
              src={driver.photo}
              alt={driver.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow"
            />
            <div className="absolute -bottom-2 -right-2 bg-brand-600 text-white p-1.5 rounded-full shadow" title="Change Photo (R2 Storage)">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-xl">{driver.name}</h3>
              {driver.verificationBadge && (
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <p className="text-xs text-slate-500">{driver.email}</p>
            <span className="inline-block mt-1 text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
              Status: {driver.status}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Area / Locality</label>
              <input
                type="text"
                value={area}
                onChange={e => setArea(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Years of Driving Experience</label>
              <input
                type="number"
                value={experienceYears}
                onChange={e => setExperienceYears(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Profile Summary & Experience</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* DOCUMENT VERIFICATION SECTION (Cloudflare R2 Storage Simulation) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">Verification Documents</h3>
            <p className="text-xs text-slate-500">
              Cloudflare R2 Bucket Upload Architecture (<code className="text-brand-600 bg-brand-50 px-1 py-0.5 rounded">localdrivers-media</code>)
            </p>
          </div>
          <Cloud className="w-6 h-6 text-brand-600" />
        </div>

        <div className="space-y-4 mt-6">
          {driver.documents.map(doc => (
            <div
              key={doc.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-brand-600 p-1.5 bg-brand-50 rounded-xl border border-brand-100 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{doc.type}</h4>
                  <span className="text-[11px] text-slate-500">
                    Uploaded: {doc.uploadedAt || 'Not yet'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {doc.status === 'Verified' ? (
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Verified
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    {doc.status}
                  </span>
                )}

                <label className="cursor-pointer px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shadow-sm">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>{uploadingDocType === doc.type ? 'Uploading to R2...' : 'Re-upload'}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleDocumentUpload(doc.type, e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
