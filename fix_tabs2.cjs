const fs = require('fs');
let content = fs.readFileSync('src/pages/TeamDetailPage.tsx', 'utf8');

// The exact string before Right Column:
const badBlock = `              ))}
            </div>
          </div>
        </div>

          </div>
        </div>

        {/* Right Column: Activities & Reports */}`;

const goodBlock = `              ))}
            </div>
          </div>
        </div>
        </div>

        {/* Right Column: Activities & Reports */}`;

content = content.replace(badBlock, goodBlock);
fs.writeFileSync('src/pages/TeamDetailPage.tsx', content);
