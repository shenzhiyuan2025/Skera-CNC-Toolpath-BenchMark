import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileUp, Gauge, LoaderCircle, Upload } from 'lucide-react';
import { evaluateToolpath, ToolpathEvaluationResult } from '../services/toolpathApi';

const severityStyle: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-700',
  info: 'bg-slate-100 text-slate-700'
};

export const ToolpathBenchmark: React.FC = () => {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [gcodeText, setGcodeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ToolpathEvaluationResult | null>(null);

  const scoreCards = useMemo(() => {
    if (!result) {
      return [];
    }
    const score = result.score;
    return [
      { key: 'safety', label: '几何/安全', value: score.safety },
      { key: 'efficiency', label: '效率', value: score.efficiency },
      { key: 'stability', label: '稳定性', value: score.stability },
      { key: 'surface', label: '表面质量', value: score.surface },
      { key: 'tool_life', label: '刀具寿命', value: score.tool_life },
      { key: 'gcode_quality', label: 'G代码质量', value: score.gcode_quality },
      { key: 'strategy', label: '策略适配', value: score.strategy }
    ];
  }, [result]);

  const handleAnalyze = async () => {
    const trimmedText = gcodeText.trim();
    if (!file && !trimmedText) {
      setError('请上传刀路文件或输入 G 代码文本');
      setResult(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await evaluateToolpath({
        file: file || undefined,
        gcodeText: trimmedText
      });
      setResult(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : '评测失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">刀路评测工具</h1>
            <p className="text-slate-600 mt-1">拖拽 NC/G-code 文件或直接粘贴代码，输出仿真、评分、问题与修复建议</p>
          </div>
          <a href="/a2ui" className="btn-secondary">
            返回 A2UI
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              文件拖拽上传
            </h2>
            <div
              onDrop={onDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'
              }`}
            >
              <FileUp className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-700 font-medium">拖拽 .nc / .tap / .gcode 文件到这里</p>
              <p className="text-sm text-slate-500 mt-1">或点击选择本地文件</p>
              <label className="inline-flex mt-4">
                <input
                  type="file"
                  className="hidden"
                  accept=".nc,.tap,.gcode,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <span className="btn-secondary cursor-pointer">选择文件</span>
              </label>
              {file && <p className="text-sm text-blue-700 mt-3">已选择：{file.name}</p>}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">G 代码输入</h2>
            <textarea
              value={gcodeText}
              onChange={(e) => setGcodeText(e.target.value)}
              className="input-field min-h-[250px] font-mono text-sm"
              placeholder="例如:
G90 G21
G0 X0 Y0 Z20
G1 Z-1 F200
G1 X20 Y0 F600"
            />
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-slate-500">支持上传文件与文本二选一，若同时提供则优先文件内容</p>
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Gauge className="w-4 h-4" />}
                开始评测
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="card p-4 border-red-200 bg-red-50">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className={`card p-5 ${result.fail_fast ? 'border-red-200' : 'border-emerald-200'}`}>
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-2">
                  {result.fail_fast ? (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  )}
                  <h3 className="text-xl font-bold text-slate-900">
                    总分 {result.score.total.toFixed(2)} / 100
                  </h3>
                  <span className={`badge ${result.fail_fast ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {result.fail_fast ? 'Fail-Fast 触发' : '通过红线检查'}
                  </span>
                </div>
                <div className="text-sm text-slate-600">
                  段数 {result.metrics.motion_segments} · 总路径 {result.metrics.total_distance} mm · 估计切削时长 {result.metrics.estimated_time_min} min
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
              {scoreCards.map((item) => (
                <div key={item.key} className="card p-4">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{item.value.toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="card p-5">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">问题与建议</h3>
                <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
                  {result.issues.length === 0 && (
                    <p className="text-slate-500 text-sm">未发现明显问题。</p>
                  )}
                  {result.issues.map((issue, idx) => (
                    <div key={`${issue.code}_${idx}`} className="border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{issue.code}</p>
                        <span className={`px-2 py-0.5 text-xs rounded ${severityStyle[issue.severity] || severityStyle.info}`}>
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mt-1">{issue.message}</p>
                      <p className="text-xs text-slate-500 mt-1">行号：{issue.line_no ?? '-'}</p>
                      {issue.suggestion && <p className="text-sm text-blue-700 mt-2">建议：{issue.suggestion}</p>}
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h4 className="font-medium text-slate-800 mb-2">修复优先建议</h4>
                  <ul className="space-y-1">
                    {result.suggestions.map((text, i) => (
                      <li key={i} className="text-sm text-slate-700">- {text}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">刀路仿真片段</h3>
                <div className="max-h-[560px] overflow-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2">行</th>
                        <th className="text-left px-3 py-2">模式</th>
                        <th className="text-left px-3 py-2">起点 XYZ</th>
                        <th className="text-left px-3 py-2">终点 XYZ</th>
                        <th className="text-right px-3 py-2">长度</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.simulation.slice(0, 200).map((seg, idx) => (
                        <tr key={`${seg.line_no}_${idx}`} className="border-t border-slate-100">
                          <td className="px-3 py-2 text-slate-600">{seg.line_no}</td>
                          <td className="px-3 py-2 font-medium text-slate-900">{seg.mode}</td>
                          <td className="px-3 py-2 text-slate-700">
                            {seg.start.x.toFixed(2)}, {seg.start.y.toFixed(2)}, {seg.start.z.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-slate-700">
                            {seg.end.x.toFixed(2)}, {seg.end.y.toFixed(2)}, {seg.end.z.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700">{seg.length.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-500 mt-2">当前展示前 200 段，用于快速检查刀路连贯性与异常跳变</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
