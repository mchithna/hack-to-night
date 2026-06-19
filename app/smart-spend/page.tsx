'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import Sidebar from '@/components/sidebar'
import { Search, Bell, AlertTriangle } from '@/components/Icons'
import Image from 'next/image'

type Category = { name: string; percentage: number; amount: number; color: string }

type AnalyticsData = {
  totalSpend: number
  categories: Category[]
  monthlyProgress: { current: number; target: number }
  savingsGoal: { current: number; target: number }
  spendAlerts: { category: string; current: number; threshold: number; isAlert: boolean }[]
}

/* ── SVG Donut Chart ─────────────────────────────────── */
function DonutChart({ categories, total }: { categories: Category[]; total: number }) {
  const size = 200
  const strokeWidth = 32
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  let cumulativeOffset = 0

  return (
    <div className="flex flex-col items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="animate-scale-in">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f0f0f0" strokeWidth={strokeWidth} />
        {categories.map((cat, i) => {
          const dashLength = (cat.percentage / 100) * circumference
          const dashOffset = circumference - cumulativeOffset
          cumulativeOffset += dashLength
          return (
            <circle
              key={cat.name}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={cat.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{
                animation: `donutDraw 1s ease-out ${0.3 + i * 0.2}s both`,
                ['--circumference' as any]: circumference
              }}
            />
          )
        })}
        <text x="50%" y="48%" textAnchor="middle" className="text-2xl font-extrabold" fill="#1f2937" dy=".1em">
          Rs. {(total / 1000).toFixed(0)}k
        </text>
        <text x="50%" y="60%" textAnchor="middle" className="text-xs" fill="#9ca3af" dy=".1em">
          Total Spend
        </text>
      </svg>

      <div className="flex flex-wrap justify-center gap-4">
        {categories.map((cat) => (
          <div key={cat.name} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
            <span className="text-gray-600">{cat.name}</span>
            <span className="font-semibold text-gray-800">{cat.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main Page ────────────────────────────────────────── */
export default function SmartSpendPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setAnalytics(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const monthPct = analytics
    ? Math.min((analytics.monthlyProgress.current / analytics.monthlyProgress.target) * 100, 100)
    : 0
  const savingsPct = analytics
    ? (analytics.savingsGoal.current / analytics.savingsGoal.target) * 100
    : 0

  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-[#F8F9FA]">
      <Sidebar />

      <section className="flex-1 p-6 md:p-10 overflow-y-auto page-transition">
        {/* Header */}
        <header className="flex justify-between items-center mb-10 animate-fade-in-down">
          <h1 className="text-3xl font-bold text-gray-800">Smart Spend</h1>
          <div className="flex items-center gap-6 text-gray-500">
            <Search size={22} className="cursor-pointer hover:text-gray-700 transition-colors" />
            <Bell size={22} className="cursor-pointer hover:text-gray-700 transition-colors" />
            <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden shadow-sm">
              <Image src="/person-logo.png" alt="Profile" width={40} height={40} className="object-cover" />
            </div>
          </div>
        </header>

        {/* Skeleton Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`skeleton ${i <= 2 ? 'h-80' : 'h-48'}`} style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ─── Spend by Category (Donut Chart) ─── */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover-lift animate-fade-in-up stagger-1">
              <h2 className="text-xl font-bold mb-6 text-gray-800">Spend by Category</h2>
              {analytics && <DonutChart categories={analytics.categories} total={analytics.totalSpend} />}

              <div className="mt-6 space-y-3">
                {analytics?.categories.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <span className="w-2 h-8 rounded-full" style={{ background: cat.color }} />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm font-medium mb-1">
                        <span className="text-gray-600">{cat.name}</span>
                        <span className="text-gray-800">Rs. {cat.amount.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full animate-progress"
                          style={{ width: `${cat.percentage}%`, background: cat.color }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Monthly Progress ─── */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover-lift animate-fade-in-up stagger-2">
              <h2 className="text-xl font-bold mb-6 text-gray-800">Monthly Progress</h2>
              <div className="flex flex-col items-center justify-center h-56 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 rounded-2xl border border-indigo-100/50 relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-indigo-100/30 animate-float" />
                <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-purple-100/30 animate-float" style={{ animationDelay: '1.5s' }} />

                <div className="relative z-10 text-center">
                  <div className="text-sm font-semibold text-indigo-600 mb-2 uppercase tracking-widest">
                    Spend vs Target
                  </div>
                  <div className="text-4xl font-extrabold text-gray-800">
                    Rs. {analytics?.monthlyProgress.current.toLocaleString()}
                    <span className="text-xl text-gray-400 font-normal">
                      {' '}/ {analytics?.monthlyProgress.target.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-64 bg-gray-200/60 rounded-full h-4 mt-6 overflow-hidden">
                    <div
                      className="h-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-progress"
                      style={{ width: `${monthPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{Math.round(monthPct)}% of monthly budget used</p>
                </div>
              </div>
            </div>

            {/* ─── Savings Goals ─── */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover-lift animate-fade-in-up stagger-3">
              <h2 className="text-xl font-bold mb-6 text-gray-800">Savings Goals</h2>
              <div className="p-6 border border-gray-100 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl animate-float">
                      🚗
                    </div>
                    <div>
                      <span className="text-gray-800 font-bold block">New Car Fund</span>
                      <span className="text-xs text-gray-500">Target by Dec 2026</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-green-600 font-bold block">
                      Rs. {analytics?.savingsGoal.current.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">
                      of Rs. {analytics?.savingsGoal.target.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200/60 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 animate-progress"
                    style={{ width: `${savingsPct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-right mt-2">{Math.round(savingsPct)}% completed</p>
              </div>
            </div>

            {/* ─── Spend Alerts ─── */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover-lift animate-fade-in-up stagger-4">
              <h2 className="text-xl font-bold mb-6 text-gray-800">Spend Alerts</h2>
              <div className="space-y-4">
                {analytics?.spendAlerts.map((alert, i) => (
                  <div
                    key={alert.category}
                    className={`p-5 rounded-xl border flex items-start gap-4 transition-all duration-300 ${
                      alert.isAlert
                        ? 'bg-red-50 border-red-200 animate-pulse-glow-once'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                    style={{ animationDelay: `${0.5 + i * 0.15}s` }}
                  >
                    <div className={`mt-0.5 ${alert.isAlert ? 'text-red-500' : 'text-gray-400'}`}>
                      <AlertTriangle size={22} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-bold ${alert.isAlert ? 'text-red-800' : 'text-gray-700'}`}>
                          {alert.category} Budget
                        </span>
                        {alert.isAlert && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-black uppercase tracking-wider animate-pulse">
                            Warning
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        Spent{' '}
                        <span className="font-semibold text-gray-800">
                          Rs. {alert.current.toLocaleString()}
                        </span>{' '}
                        of Rs. {alert.threshold.toLocaleString()}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-3 overflow-hidden">
                        <div
                          className={`h-2 rounded-full animate-progress ${
                            alert.isAlert ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${Math.min((alert.current / alert.threshold) * 100, 100)}%` }}
                        />
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
  )
}
