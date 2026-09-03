import React, { useState, useEffect } from 'react';
import {
  Database,
  Table,
  Columns,
  Plus,
  Edit2,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Terminal,
  Layers,
  ChevronDown,
  ChevronUp,
  HardDrive,
  Check,
  X,
  Code
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { toPersianDigits } from '../../utils/persianDate';

export interface ColumnDef {
  name: string;
  type: string;
  nullable: boolean;
  key: string;
  defaultValue: string | null;
  comment: string;
}

export interface TableDef {
  name: string;
  titleFa: string;
  comment: string;
  engine: string;
  collation: string;
  columns: ColumnDef[];
  indexes: any[];
  rows: number;
}

const SUPPORTED_TYPES = [
  'LONGTEXT',
  'VARCHAR(255)',
  'VARCHAR(128)',
  'VARCHAR(64)',
  'TEXT',
  'MEDIUMTEXT',
  'INT',
  'BIGINT',
  'TINYINT(1)',
  'TIMESTAMP',
  'DATETIME',
  'DECIMAL(10,2)'
];

export const MySQLSchemaManager: React.FC = () => {
  const { success: showSuccess, error: showError } = useNotification();
  const [tables, setTables] = useState<Record<string, TableDef>>({});
  const [selectedTable, setSelectedTable] = useState<string>('mahash_reports');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // New Column Form state
  const [showAddColumn, setShowAddColumn] = useState<boolean>(false);
  const [newColName, setNewColName] = useState<string>('');
  const [newColType, setNewColType] = useState<string>('LONGTEXT');
  const [newColNullable, setNewColNullable] = useState<boolean>(true);
  const [newColDefault, setNewColDefault] = useState<string>('');
  const [newColComment, setNewColComment] = useState<string>('');

  // Modify Column state
  const [editingColName, setEditingColName] = useState<string | null>(null);
  const [editColType, setEditColType] = useState<string>('LONGTEXT');

  // Raw SQL state
  const [showRawSql, setShowRawSql] = useState<boolean>(false);
  const [rawSql, setRawSql] = useState<string>('');
  const [sqlResult, setSqlResult] = useState<string | null>(null);

  const fetchSchema = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mysql/schema');
      const data = await res.json();
      if (data && data.tables) {
        setTables(data.tables);
      }
    } catch (err) {
      console.warn('Failed to fetch MySQL schema:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, []);

  const curTableDef = tables[selectedTable];

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) {
      showError('خطا در اعتبارسنجی', 'لطفاً نام ستون را به حروف انگلیسی وارد نمایید.');
      return;
    }

    const colNameClean = newColName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    setSubmitting(true);
    try {
      const res = await fetch('/api/mysql/schema/alter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_column',
          table: selectedTable,
          columnName: colNameClean,
          columnType: newColType,
          nullable: newColNullable,
          defaultValue: newColDefault.trim() || null,
          comment: newColComment.trim() || 'ستون اضافه شده از پنل مدیریت'
        })
      });

      const data = await res.json();
      if (data.success) {
        showSuccess('ستون با موفقیت اضافه شد', `ستون ${colNameClean} با نوع ${newColType} بدون استقرار مجدد به جدول ${selectedTable} افزوده شد.`);
        setNewColName('');
        setNewColDefault('');
        setNewColComment('');
        setShowAddColumn(false);
        fetchSchema();
      } else {
        throw new Error(data.error || 'خطا در افزودن ستون');
      }
    } catch (err: any) {
      showError('خطا در تغییر اسکیما', err?.message || 'عملیات با خطا مواجه شد.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModifyColumnType = async (colName: string, newType: string) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/mysql/schema/alter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'modify_column',
          table: selectedTable,
          columnName: colName,
          newType: newType
        })
      });

      const data = await res.json();
      if (data.success) {
        showSuccess('نوع ستون بروزرسانی شد', `نوع ستون ${colName} به ${newType} تغییر یافت.`);
        setEditingColName(null);
        fetchSchema();
      } else {
        throw new Error(data.error || 'خطا در تغییر نوع ستون');
      }
    } catch (err: any) {
      showError('خطا در تغییر نوع ستون', err?.message || 'عملیات با خطا مواجه شد.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpgradeToLongtext = async () => {
    if (!confirm('آیا مایلید تمام ستون‌های محتوایی این جدول (خلاصه، متن، ویدیو، پیوست‌ها) به ظرفیت حداکثری ۴ گیگابایت (LONGTEXT) ارتقا یابند؟')) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/mysql/schema/alter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upgrade_to_longtext',
          table: selectedTable
        })
      });

      const data = await res.json();
      if (data.success) {
        showSuccess('ارتقای اسکیما موفق بود', 'کلیه ستون‌های اصلی جدول به نوع دائمی و پرظرفیت LONGTEXT ارتقا یافتند.');
        fetchSchema();
      } else {
        throw new Error(data.error || 'خطا در ارتقای اسکیما');
      }
    } catch (err: any) {
      showError('خطا در ارتقا', err?.message || 'خطا رخ داد.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteRawSql = async () => {
    if (!rawSql.trim()) return;
    setSubmitting(true);
    setSqlResult(null);
    try {
      const res = await fetch('/api/mysql/schema/alter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'raw_sql',
          sql: rawSql.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setSqlResult(`عملیات با موفقیت در پایگاه داده MySQL اجرا شد:\n${rawSql}`);
        showSuccess('دستور SQL اجرا شد', 'دستور بدون استقرار مجدد بر روی MySQL اعمال شد.');
        fetchSchema();
      } else {
        throw new Error(data.error || 'خطا در اجرای SQL');
      }
    } catch (err: any) {
      setSqlResult(`خطا در اجرای دستور: ${err?.message}`);
      showError('خطا در اجرای دستور SQL', err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const tableList = Object.keys(tables);

  return (
    <div className="space-y-6">
      {/* Top Banner with Actions */}
      <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50 dark:from-slate-800 dark:via-slate-850 dark:to-indigo-950/40 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base">
              مدیریت اسکیمای دیتابیس MySQL (Schema Management)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تنظیم و اصلاح ساختار جداول، تغییر نوع ستون‌ها (LONGTEXT، VARCHAR و ...) و افزودن فیلدهای گزارش بدون نیاز به استقرار مجدد
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleUpgradeToLongtext}
            disabled={submitting}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="ارتقا تمام ستون‌های متنی به ۴ گیگابایت"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>ارتقا به LONGTEXT (ظرفیت ۴ گیگابایت)</span>
          </button>

          <button
            onClick={() => setShowRawSql(!showRawSql)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-slate-100 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>{showRawSql ? 'بستن کنسول SQL' : 'کنسول مستقیم DDL'}</span>
          </button>

          <button
            onClick={fetchSchema}
            disabled={loading}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            title="بروزرسانی اسکیما"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Raw SQL Console (Collapsible) */}
      {showRawSql && (
        <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <Code className="w-4 h-4" />
              <span>اجرای مستقیم فرامین DDL / ALTER TABLE در MySQL:</span>
            </span>
            <span className="text-[10px] text-slate-400">MySQL InnoDB Ready</span>
          </div>

          <textarea
            value={rawSql}
            onChange={(e) => setRawSql(e.target.value)}
            placeholder="مثال: ALTER TABLE `mahash_reports` ADD COLUMN `priority_level` VARCHAR(32) DEFAULT 'normal';"
            className="w-full h-20 bg-slate-950 text-emerald-400 font-mono text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
            dir="ltr"
          />

          <div className="flex items-center justify-between">
            <button
              onClick={handleExecuteRawSql}
              disabled={submitting || !rawSql.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{submitting ? 'در حال اجرا...' : 'اجرای دستور SQL'}</span>
            </button>

            {sqlResult && (
              <span className="text-xs font-mono text-emerald-400 truncate max-w-[400px]">
                {sqlResult}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Table Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {tableList.map((tName) => {
          const t = tables[tName];
          const isSelected = selectedTable === tName;
          return (
            <button
              key={tName}
              onClick={() => setSelectedTable(tName)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>{t?.titleFa || tName}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}>
                {toPersianDigits(t?.rows ?? 0)} رکورد
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Table Details */}
      {curTableDef && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-6">
          {/* Table Meta Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                  {curTableDef.name}
                </span>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {curTableDef.titleFa}
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {curTableDef.comment}
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                <span>موتور: <strong className="font-mono text-slate-700 dark:text-slate-300">{curTableDef.engine}</strong></span>
              </span>
              <span>•</span>
              <span>کدگذاری: <strong className="font-mono text-slate-700 dark:text-slate-300">{curTableDef.collation}</strong></span>
            </div>
          </div>

          {/* Columns Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Columns className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>فهرست فیلدها و ستون‌های جدول ({toPersianDigits(curTableDef.columns?.length || 0)} ستون)</span>
              </h5>

              <button
                onClick={() => setShowAddColumn(!showAddColumn)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن ستون جدید</span>
              </button>
            </div>

            {/* Add Column Form (Expandable) */}
            {showAddColumn && (
              <form onSubmit={handleAddColumn} className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
                  مشخصات ستون جدید برای جدول {curTableDef.name}:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 font-bold block mb-1">نام ستون (انگلیسی):</label>
                    <input
                      type="text"
                      value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      placeholder="مثال: reviewer_name"
                      className="w-full bg-white dark:bg-slate-800 text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono"
                      dir="ltr"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 font-bold block mb-1">نوع داده (Type):</label>
                    <select
                      value={newColType}
                      onChange={(e) => setNewColType(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono"
                      dir="ltr"
                    >
                      {SUPPORTED_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 font-bold block mb-1">مقدار پیش‌فرض (اختیاری):</label>
                    <input
                      type="text"
                      value={newColDefault}
                      onChange={(e) => setNewColDefault(e.target.value)}
                      placeholder="NULL یا مقدار پیش‌فرض"
                      className="w-full bg-white dark:bg-slate-800 text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 font-bold block mb-1">توضیح فارسی ستون:</label>
                    <input
                      type="text"
                      value={newColComment}
                      onChange={(e) => setNewColComment(e.target.value)}
                      placeholder="توضیح کاربرد فیلد"
                      className="w-full bg-white dark:bg-slate-800 text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={newColNullable}
                      onChange={(e) => setNewColNullable(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>ستون می‌تواند مقدار خالی (NULL) بپذیرد</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddColumn(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{submitting ? 'در حال ثبت...' : 'ثبت ستون در دیتابیس'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Table Listing */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">نام ستون (Field)</th>
                    <th className="p-3">نوع داده (Data Type)</th>
                    <th className="p-3">کلید (Key)</th>
                    <th className="p-3">خالی‌پذیر (Null)</th>
                    <th className="p-3">مقدار پیش‌فرض</th>
                    <th className="p-3">شرح ستون</th>
                    <th className="p-3 text-center">عملیات نوع ستون</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {curTableDef.columns?.map((col) => {
                    const isEditing = editingColName === col.name;
                    const isLongText = col.type.toUpperCase().includes('LONGTEXT');

                    return (
                      <tr key={col.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                        <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {col.name}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <select
                                value={editColType}
                                onChange={(e) => setEditColType(e.target.value)}
                                className="bg-white dark:bg-slate-800 text-xs p-1 rounded border border-indigo-400 font-mono"
                                dir="ltr"
                              >
                                {SUPPORTED_TYPES.map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleModifyColumnType(col.name, editColType)}
                                className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                title="ذخیره نوع جدید"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingColName(null)}
                                className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                                title="انصراف"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                              isLongText
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}>
                              {col.type}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {col.key === 'PRI' ? (
                            <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              PRIMARY
                            </span>
                          ) : col.key === 'MUL' ? (
                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              INDEX
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">-</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500">
                          {col.nullable ? 'YES' : 'NO'}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-500">
                          {col.defaultValue ?? 'NULL'}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {col.comment || '-'}
                        </td>
                        <td className="p-3 text-center">
                          {col.key !== 'PRI' && !isEditing && (
                            <button
                              onClick={() => {
                                setEditingColName(col.name);
                                setEditColType(col.type);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                              title="تغییر نوع ستون بدون نیاز به استقرار مجدد"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>تغییر نوع</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
