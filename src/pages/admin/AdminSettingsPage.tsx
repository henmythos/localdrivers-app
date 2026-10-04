import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Database, Cloud, Shield } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      <button
        onClick={() => navigate('/admin/dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Admin Dashboard
      </button>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Platform System Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Turso database & Cloudflare R2 storage architecture state</p>
      </div>

      <div className="space-y-6">
        {/* Database Config Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-brand-600" />
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Turso SQLite Database Architecture</h3>
              <p className="text-xs text-slate-500">libSQL client abstraction & schema definition</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-mono space-y-1 text-slate-700">
            <div>TURSO_DATABASE_URL: libsql://database-cyclamen-desert-vercel-icfg-cnxx2242ugtirkjfrpb3fzwu.aws-ap-south-1.turso.io</div>
            <div>TURSO_AUTH_TOKEN: eyJhbGciOiJFZERT... (Connected via Vercel Integration)</div>
            <div>REGION: aws-ap-south-1 (Mumbai / South Asia Low Latency)</div>
            <div>STATUS: Active & Synchronized</div>
          </div>
        </div>

        {/* Cloudflare R2 Storage Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            <Cloud className="w-6 h-6 text-orange-600" />
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Cloudflare R2 Bucket Storage</h3>
              <p className="text-xs text-slate-500">Secure signed upload endpoints & document CDN</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-mono space-y-1 text-slate-700">
            <div>R2_BUCKET_NAME: localdrivers</div>
            <div>R2_ACCOUNT_ID: 3b25d6fc00d328f896be8a3382324774</div>
            <div>PUBLIC_DEV_URL: https://pub-e6716545434140d796808e125fc8dc7d.r2.dev</div>
            <div>S3_API_ENDPOINT: https://3b25d6fc00d328f896be8a3382324774.r2.cloudflarestorage.com/localdrivers</div>
            <div>LOCATION: Asia-Pacific (APAC)</div>
            <div>STATUS: Connected & Active</div>
          </div>
        </div>
      </div>
    </div>
  );
};
