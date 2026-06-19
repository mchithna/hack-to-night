'use client'

import React, { useEffect, useState } from 'react'
import Sidebar from '@/components/sidebar'
import { Search, Bell, AlertTriangle } from '@/components/Icons'
import Image from 'next/image'

type AnalyticsData = {
  totalSpend: number;
  categories: { name: string, percentage: number, amount: number }[];
  monthlyProgress: { current: number, target: number };
  savingsGoal: { current: number, target: number };
  spendAlerts: { category: string, current: number, threshold: number, isAlert: boolean }[];
}

export default function SmartSpendPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app we would get the user ID from the session context
    fetch('/api/analytics?userId=1')
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setAnalytics(data)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-[#F8F9FA]">
      <Sidebar />
      <section className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800">Smart Spend</h1>
          <div className="flex items-center gap-6 text-gray-500">
            <Search size={22} className="cursor-pointer hover:text-gray-700" />
            <Bell size={22} className="cursor-pointer hover:text-gray-700" />
            <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden shadow-sm">
              <Image src="/person-logo.png" alt="Profile" width={40} height={40} className="object-cover" />
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-500 animate-pulse">Loading analytics...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Spend by Category */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 text-gray-800">Spend by Category</h2>
              <div className="space-y-5">
                {analytics?.categories.map((cat) => (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm font-medium mb-2">
                      <span className="text-gray-600">{cat.name}</span>
                      <span className="text-gray-800">Rs. {cat.amount.toLocaleString()} <span className="text-gray-400 font-normal">({cat.percentage}%)</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          cat.name === 'Shopping' ? 'bg-purple-500' : 
                          cat.name === 'Bills' ? 'bg-blue-500' : 
                          'bg-green-500'
                        }`} 
                        style={{ width: `${cat.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Progress */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 text-gray-800">Monthly Progress</h2>
              <div className="flex flex-col items-center justify-center h-48 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
                <div className="text-sm font-medium text-indigo-600 mb-2 uppercase tracking-wider">Total Spend vs Target</div>
                <div className="text-4xl font-extrabold text-gray-800">
                  Rs. {analytics?.monthlyProgress.current.toLocaleString()} 
                  <span className="text-2xl text-gray-400 font-normal"> / {analytics?.monthlyProgress.target.toLocaleString()}</span>
                </div>
                <div className="w-3/4 bg-gray-200 rounded-full h-4 mt-6">
                  <div 
                    className="h-4 rounded-full bg-indigo-600 transition-all duration-500" 
                    style={{ width: `${Math.min((analytics!.monthlyProgress.current / analytics!.monthlyProgress.target) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Savings Goals */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 text-gray-800">Savings Goals</h2>
              <div className="p-5 border border-gray-100 rounded-xl bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl font-bold">
                      🚗
                    </div>
                    <span className="text-gray-700 font-bold">New Car Fund</span>
                  </div>
                  <span className="text-green-600 font-bold">
                    Rs. {analytics?.savingsGoal.current.toLocaleString()} / {analytics?.savingsGoal.target.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2 mt-4">
                  <div 
                    className="h-3 rounded-full bg-green-500 transition-all duration-500" 
                    style={{ width: `${(analytics!.savingsGoal.current / analytics!.savingsGoal.target) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 text-right">
                  {Math.round((analytics!.savingsGoal.current / analytics!.savingsGoal.target) * 100)}% completed
                </p>
              </div>
            </div>

            {/* Spend Alerts */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 text-gray-800">Spend Alerts</h2>
              <div className="space-y-4">
                {analytics?.spendAlerts.map((alert) => (
                  <div key={alert.category} className={`p-4 rounded-xl border flex items-start gap-4 ${alert.isAlert ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className={`mt-1 ${alert.isAlert ? 'text-red-500' : 'text-gray-400'}`}>
                      <AlertTriangle size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-bold ${alert.isAlert ? 'text-red-800' : 'text-gray-700'}`}>
                          {alert.category} Budget
                        </span>
                        {alert.isAlert && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full font-black uppercase tracking-wider">Warning</span>}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Spent <span className="font-semibold text-gray-800">Rs. {alert.current.toLocaleString()}</span> of Rs. {alert.threshold.toLocaleString()}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                        <div 
                          className={`h-1.5 rounded-full ${alert.isAlert ? 'bg-red-500' : 'bg-gray-400'}`} 
                          style={{ width: `${Math.min((alert.current / alert.threshold) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </section>
    </main>

export default function SmartSpend() {
  return (
    <div>
      <h1>Smart Spend Analytics</h1>
      <p>Developer 4 is building this feature.</p>
    </div>
dev
  )
}
