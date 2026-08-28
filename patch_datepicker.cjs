const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminPage.tsx', 'utf-8');

// Add imports
code = code.replace(
  "import {",
  "import DatePicker from 'react-multi-date-picker';\nimport persian from 'react-date-object/calendars/persian';\nimport persian_fa from 'react-date-object/locales/persian_fa';\nimport {"
);

// Replace quick edit date input
const searchQuickEdit = `              <div className="relative">
                <input
                  type="text"
                  value={customDateInput}
                  onChange={(e) => setCustomDateInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-left focus:ring-2 focus:ring-orange-500 focus:outline-none dark:text-white"
                  placeholder="مثال: ۱۴۰۵/۰۶/۱۵"
                  dir="ltr"
                />
              </div>`;

const replaceQuickEdit = `              <div className="relative" dir="rtl">
                <DatePicker
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
                />
              </div>`;

code = code.replace(searchQuickEdit, replaceQuickEdit);

// Replace form date input
const searchFormEdit = `                    <input
                      type="text"
                      id="reportDate"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none text-left dark:text-white"
                      placeholder="۱۴۰۵/۰۵/۲۰"
                      dir="ltr"
                      required
                    />`;

const replaceFormEdit = `                    <div dir="rtl" className="w-full">
                      <DatePicker
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
                      />
                    </div>`;

code = code.replace(searchFormEdit, replaceFormEdit);

fs.writeFileSync('src/pages/AdminPage.tsx', code);
