const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPage.tsx', 'utf8');

const injection = `
                    <button
                      onClick={() => handleTransferToMySQL(video)}
                      disabled={uploadingVideoId === video.reportId}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {uploadingVideoId === video.reportId ? (
                        <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CloudUpload className="w-3.5 h-3.5" />
                      )}
                      <span>انتقال به MySQL</span>
                    </button>
                    <button`;

content = content.replace('                    <button\n                      onClick={async () => {', injection + '\n                      onClick={async () => {');
fs.writeFileSync('src/pages/AdminPage.tsx', content);
