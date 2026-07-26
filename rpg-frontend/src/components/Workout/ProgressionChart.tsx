import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { HistoricalExerciseData } from '../../types';
import { TrendingUp, Dumbbell, Calendar } from 'lucide-react';

interface ProgressionChartProps {
  historicalData: Record<string, HistoricalExerciseData[]>;
}

export const ProgressionChart: React.FC<ProgressionChartProps> = ({ historicalData }) => {
  const exerciseNames = Object.keys(historicalData);
  const [selectedExercise, setSelectedExercise] = useState<string>(
    exerciseNames[0] || 'Supino Reto com Barra'
  );

  const activeData = historicalData[selectedExercise] || [];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-slate-100 text-sm sm:text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Evolução de Cargas Histórica
          </h3>
          <p className="text-xs text-slate-400">
            Acompanhe o aumento de força ao longo das semanas.
          </p>
        </div>

        {/* Exercise Selector */}
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="bg-slate-950 text-slate-200 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-cyan-500"
        >
          {exerciseNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Chart container */}
      <div className="w-full h-64 pt-2">
        {activeData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={['dataMin - 5', 'dataMax + 10']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#F8FAFC',
                }}
                formatter={(value: any) => [`${value ?? 0} kg`, 'Carga Máxima']}
              />
              <Line
                type="monotone"
                dataKey="weightKg"
                stroke="#06B6D4"
                strokeWidth={3}
                dot={{ fill: '#06B6D4', r: 5, stroke: '#0284C7', strokeWidth: 2 }}
                activeDot={{ r: 8, fill: '#38BDF8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
            Nenhum histórico registrado para este exercício ainda.
          </div>
        )}
      </div>

      {/* Stats summary footer */}
      {activeData.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Carga Inicial</span>
            <span className="font-mono font-bold text-slate-200">{activeData[0].weightKg} kg</span>
          </div>
          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Carga Atual</span>
            <span className="font-mono font-bold text-cyan-400">
              {activeData[activeData.length - 1].weightKg} kg
            </span>
          </div>
          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block font-medium">1RM Estimado</span>
            <span className="font-mono font-bold text-amber-400">
              {activeData[activeData.length - 1].estimatedOneRepMax} kg
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
