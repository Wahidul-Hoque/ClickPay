'use client';

import { useState, useEffect } from 'react';
import { Store, Search, ChevronRight, Star, Tag } from 'lucide-react';
import { merchantAPI } from '@/lib/api';
import Link from 'next/link';

export default function DiscoverMerchants() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const res = await merchantAPI.getMerchants();
      setMerchants(res.data.data);
    } catch (err) {
      console.error('Failed to load merchants');
    } finally {
      setLoading(false);
    }
  };

  const filteredMerchants = merchants.filter(m => 
    m.merchant_name.toLowerCase().includes(search.toLowerCase()) ||
    m.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Discover Services</h1>
          <p className="text-slate-500 text-sm">Subscribe to your favorite merchants for auto-payments</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search merchants or category..."
            className="input-field pl-10 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMerchants.map((merchant) => (
            <div key={merchant.merchant_user_id} className="card group hover:shadow-xl hover:border-primary-200 transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xl">
                  {merchant.merchant_name.charAt(0)}
                </div>
                <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded-md tracking-wider">
                  {merchant.category || 'General'}
                </span>
              </div>
              
              <h3 className="font-bold text-slate-900 text-lg group-hover:text-primary-600 transition-colors">
                {merchant.merchant_name}
              </h3>
              <p className="text-slate-500 text-sm mt-1 line-clamp-1">
                {merchant.business_type}
              </p>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-xs font-bold text-slate-700">Top Merchant</span>
                </div>
                <Link 
                  href={`/dashboard/subscriptions/new?merchantId=${merchant.merchant_user_id}`}
                  className="flex items-center gap-1 text-primary-600 font-bold text-sm hover:underline"
                >
                  Subscribe <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredMerchants.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No merchants found matching your search.</p>
        </div>
      )}
    </div>
  );
}