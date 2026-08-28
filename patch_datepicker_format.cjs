const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminPage.tsx', 'utf-8');

// Ensure DateObject is imported
if (!code.includes('DateObject }')) {
  code = code.replace(
    "import DatePicker from 'react-multi-date-picker';",
    "import DatePicker, { DateObject } from 'react-multi-date-picker';"
  );
}

// 1. Quick Edit Modal
const searchQuickEdit = `                <DatePicker
                  value={customDateInput}
                  onChange={(date: any) => {
                    if (date) {
                      // Format to match old output "۱۴۰۵/۰۶/۱۵"
                      setCustomDateInput(date.format('YYYY/MM/DD'));
                    } else {
                      setCustomDateInput('');
                    }
                  }}
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  inputClass="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none dark:text-white"
                  placeholder="انتخاب تاریخ"
                  containerClassName="w-full"
                />`;

const replaceQuickEdit = `                <DatePicker
                  value={customDateInput ? new DateObject({ date: customDateInput, format: 'YYYY/MM/DD', calendar: persian, locale: persian_fa }) : null}
                  onChange={(date: any) => {
                    if (date) {
                      // Format to match old output "۱۴۰۵/۰۶/۱۵"
                      setCustomDateInput(date.format('YYYY/MM/DD'));
                    } else {
                      setCustomDateInput('');
                    }
                  }}
                  format="DD MMMM YYYY"
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  inputClass="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none dark:text-white"
                  placeholder="مثلاً ۲۰ مرداد ۱۴۰۵"
                  containerClassName="w-full"
                />`;

code = code.replace(searchQuickEdit, replaceQuickEdit);

// 2. Main Edit Form
const searchFormEdit = `                      <DatePicker
                        value={reportDate}
                        onChange={(date: any) => {
                          if (date) {
                            setReportDate(date.format('YYYY/MM/DD'));
                          } else {
                            setReportDate('');
                          }
                        }}
                        calendar={persian}
                        locale={persian_fa}
                        calendarPosition="bottom-right"
                        inputClass="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white text-right"
                        placeholder="انتخاب تاریخ"
                        containerClassName="w-full"
                      />`;

const replaceFormEdit = `                      <DatePicker
                        value={reportDate ? new DateObject({ date: reportDate, format: 'YYYY/MM/DD', calendar: persian, locale: persian_fa }) : null}
                        onChange={(date: any) => {
                          if (date) {
                            setReportDate(date.format('YYYY/MM/DD'));
                          } else {
                            setReportDate('');
                          }
                        }}
                        format="DD MMMM YYYY"
                        calendar={persian}
                        locale={persian_fa}
                        calendarPosition="bottom-right"
                        inputClass="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white text-right"
                        placeholder="مثلاً ۲۰ مرداد ۱۴۰۵"
                        containerClassName="w-full"
                      />`;

code = code.replace(searchFormEdit, replaceFormEdit);

fs.writeFileSync('src/pages/AdminPage.tsx', code);
