document.addEventListener('DOMContentLoaded', () => {
    const accountsData = {
        juliePersonalFinances: {
            name: "Julie's Finances",
            subtitle: "Transactions related to the LLC.",
            balance: null,
            type: 'personal',
            transactions: [
                { date: '2025-01-15', description: 'Loan to LLC (from HELOC)', debit: 0, credit: 50000 },
                { date: '2025-03-05', description: 'Loan to LLC (Roof Share)', debit: 0, credit: 7500 },
                { date: '2025-04-05', description: 'Distribution from LLC', debit: 1000, credit: 0 },
                { date: '2025-04-06', description: 'Payment to HELOC Lender', debit: 0, credit: 500 },
                { date: '2025-04-06', description: 'Share of Mortgage Payment', debit: 0, credit: 750 },
            ]
        },
        davidPersonalFinances: {
            name: "David's Finances",
            subtitle: "Transactions related to the LLC.",
            balance: null,
            type: 'personal',
            transactions: [
                { date: '2025-03-05', description: 'Loan to LLC (Roof Share)', debit: 0, credit: 7500 },
                { date: '2025-04-05', description: 'Distribution from LLC', debit: 1000, credit: 0 },
                { date: '2025-04-06', description: 'Share of Mortgage Payment', debit: 0, credit: 750 },
            ]
        },
        llcBank: {
            name: "LLC Checking",
            subtitle: "Central hub for all business income and expenses.",
            balance: 31500,
            type: 'asset',
            transactions: [
                { date: '2025-01-15', description: 'Loan from Julie (HELOC)', debit: 50000, credit: 0 },
                { date: '2025-03-05', description: 'Loan from Members (Roof)', debit: 15000, credit: 0 },
                { date: '2025-03-10', description: 'Payment to Roofer', debit: 0, credit: 15000 },
                { date: '2025-04-01', description: 'Rental Income Received', debit: 3500, credit: 0 },
                { date: '2025-04-05', description: 'Distribution to Members', debit: 0, credit: 2000 },
            ]
        },
        llcSavings: {
            name: "LLC Savings",
            subtitle: "Reserve funds for future capital expenditures.",
            balance: 0,
            type: 'asset',
            transactions: [
                 { date: '2025-05-01', description: 'Initial Transfer from Checking', debit: 0, credit: 0 },
            ]
        },
        helocLoan: {
            name: "HELOC Loan",
            subtitle: "Liability from Julie's HELOC for the down payment.",
            balance: 50000,
            type: 'liability',
            transactions: [
                { date: '2025-01-15', description: 'Loan from Julie', debit: 0, credit: 50000 },
            ],
            financingTerms: {
                principal: 50000,
                interestRate: 6.5,
                termYears: 15,
                breakdown: {
                    Total: 50000,
                    Julie: 50000,
                    David: 0
                }
            }
        },
        memberLoan: {
            name: "Member Loan (Roof)",
            subtitle: "A formal liability owed by the LLC to its members.",
            balance: 15000,
            type: 'liability',
            transactions: [
                { date: '2025-03-05', description: 'Loan proceeds for roof', debit: 0, credit: 15000 },
            ],
            financingTerms: {
                principal: 15000,
                interestRate: 5.0,
                termYears: 10,
                breakdown: {
                    Total: 15000,
                    Julie: 7500,
                    David: 7500
                }
            }
        },
        mortgageLoan: {
            name: "672 Elm St. Mortgage",
            subtitle: "Primary mortgage for the investment property.",
            balance: 200000,
            type: 'liability',
            transactions: [
                { date: '2025-01-20', description: 'Initial Mortgage Loan', debit: 0, credit: 200000 },
            ],
            financingTerms: {
                principal: 200000,
                interestRate: 7.1,
                termYears: 30
            }
        },
        propertyAsset: {
            name: "672 Elm St",
            subtitle: "The capitalized value of the building and improvements.",
            balance: 265000,
            type: 'asset',
            transactions: [
                { date: '2025-01-20', description: 'Property Acquisition (Building Value)', debit: 250000, credit: 0 },
                { date: '2025-03-10', description: 'Capital Improvement (New Roof)', debit: 15000, credit: 0 },
            ]
        },
        rent: {
            name: "Rent Roll",
            subtitle: "Monthly rental income from all units.",
            totalMonthlyRent: 5000,
            type: 'revenue',
            baseTenants: [
                { id: 0, floor: "1st Floor", renter: "NA" },
                { id: 1, floor: "2nd Floor", renter: "Gina" },
                { id: 2, floor: "2nd Floor", renter: "ECC" },
                { id: 3, floor: "3rd Floor", renter: "Timoth" },
                { id: 4, floor: "3rd Floor", renter: "Angua" },
                { id: 5, floor: "Barn", renter: "Steve" }
            ],
            monthlyRecords: [
                {
                    month: "2025-08",
                    tenants: [
                        { id: 0, monthlyRent: "TBD", due: 0, received: 0 },
                        { id: 1, monthlyRent: 1300, due: 1300, received: 1300 },
                        { id: 2, monthlyRent: 1250, due: 1250, received: 1250 },
                        { id: 3, monthlyRent: 1200, due: 1200, received: 0 },
                        { id: 4, monthlyRent: 0, due: 0, received: 0 },
                        { id: 5, monthlyRent: 1250, due: 1250, received: 1250 }
                    ]
                }
            ]
        }
    };

    // --- Gemini API Integration ---
    const callGemini = async (prompt, maxRetries = 3) => {
        let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = { contents: chatHistory };
        const apiKey = ""; // API key is handled by the environment
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                if (result.candidates && result.candidates.length > 0 &&
                    result.candidates[0].content && result.candidates[0].content.parts &&
                    result.candidates[0].content.parts.length > 0) {
                    return result.candidates[0].content.parts[0].text;
                } else {
                    throw new Error("Invalid response structure from Gemini API");
                }
            } catch (error) {
                if (i === maxRetries - 1) {
                    console.error("Gemini API call failed after multiple retries:", error);
                    return "Sorry, I was unable to process your request at this time. Please try again later.";
                }
                const delay = Math.pow(2, i) * 1000; // Exponential backoff
                await new Promise(res => setTimeout(res, delay));
            }
        }
    };

    const generateSummaryBtn = document.getElementById('generate-summary-btn');
    const summaryLoader = document.getElementById('summary-loader');
    const summaryOutput = document.getElementById('summary-output');

    generateSummaryBtn.addEventListener('click', async () => {
        summaryLoader.style.display = 'flex';
        summaryOutput.style.display = 'none';
        summaryOutput.textContent = '';

        const financialData = {
            assets: {
                propertyValue: accountsData.propertyAsset.balance,
                checking: accountsData.llcBank.balance,
                savings: accountsData.llcSavings.balance
            },
            liabilities: {
                mortgageLoan: accountsData.mortgageLoan.balance,
                helocLoan: accountsData.helocLoan.balance,
                memberLoan: accountsData.memberLoan.balance
            },
            recentTransactions: accountsData.llcBank.transactions.slice(-5)
        };

        const prompt = `You are a financial analyst for a small real estate LLC. Based on the following JSON data, provide a concise, easy-to-read summary of the LLC's current financial health in markdown format. Highlight key metrics like liquidity (cash on hand), total debt, and net asset value (Assets - Liabilities). Analyze the recent transactions for cash flow insights.
        
        Data: ${JSON.stringify(financialData)}`;

        const summary = await callGemini(prompt);
        summaryOutput.innerHTML = summary.replace(/\n/g, '<br>'); // Basic markdown support
        summaryLoader.style.display = 'none';
        summaryOutput.style.display = 'block';
    });
    
    const askAiBtn = document.getElementById('ask-ai-btn');
    const askAiLoader = document.getElementById('ask-ai-loader');
    const askAiOutput = document.getElementById('ask-ai-output');
    const aiQuestionInput = document.getElementById('ai-accountant-question');

    askAiBtn.addEventListener('click', async () => {
        const question = aiQuestionInput.value;
        if (!question.trim()) {
            askAiOutput.textContent = "Please enter a question.";
            askAiOutput.style.display = 'block';
            return;
        }

        askAiLoader.style.display = 'flex';
        askAiOutput.style.display = 'none';
        askAiOutput.textContent = '';

        const prompt = `You are an expert real estate accountant providing advice to a small LLC owner. Answer the following question clearly and concisely in markdown format.
        
        Question: "${question}"`;

        const answer = await callGemini(prompt);
        askAiOutput.innerHTML = answer.replace(/\n/g, '<br>');
        askAiLoader.style.display = 'none';
        askAiOutput.style.display = 'block';
    });


    // --- Existing Dashboard Logic ---
    function formatCurrency(amount) {
        if (amount === null || isNaN(amount)) return '';
        return Number(amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }
    
    function calculateTotalEquity() {
        const totalAssets = Object.values(accountsData)
            .filter(acc => acc.type === 'asset')
            .reduce((sum, acc) => sum + acc.balance, 0);

        const totalLiabilities = Object.values(accountsData)
            .filter(acc => acc.type === 'liability')
            .reduce((sum, acc) => sum + acc.balance, 0);
            
        return totalAssets - totalLiabilities;
    }

    function updateDashboardBalances() {
        document.getElementById('property-asset-balance').textContent = formatCurrency(accountsData.propertyAsset.balance);
        document.getElementById('llc-bank-balance').textContent = formatCurrency(accountsData.llcBank.balance);
        document.getElementById('llc-savings-balance').textContent = formatCurrency(accountsData.llcSavings.balance);
        document.getElementById('heloc-loan-balance').textContent = formatCurrency(accountsData.helocLoan.balance);
        document.getElementById('member-loan-balance').textContent = formatCurrency(accountsData.memberLoan.balance);
        document.getElementById('mortgage-loan-balance').textContent = formatCurrency(accountsData.mortgageLoan.balance);
        document.getElementById('rent-roll-total').textContent = formatCurrency(accountsData.rent.totalMonthlyRent);
        document.getElementById('total-equity-balance').textContent = formatCurrency(calculateTotalEquity());
    }
    
    const modal = document.getElementById('account-modal');
    const modalBg = modal.querySelector('.modal-bg');
    const modalContent = modal.querySelector('.modal-content');
    const closeModalBtn = document.getElementById('close-modal-btn');

    document.querySelectorAll('.account-card').forEach(card => {
        card.addEventListener('click', () => {
            const accountId = card.dataset.accountId;
            if (accountId) openModal(accountId);
        });
    });

    function openModal(accountId) {
        let data;
        if (accountId === 'totalEquity') {
            data = { name: "Owner's Equity Calculation", subtitle: "A snapshot of the LLC's net worth." };
        } else {
            data = accountsData[accountId];
        }

        modal.dataset.currentAccount = accountId;
        document.getElementById('modal-title').textContent = data.name;
        document.getElementById('modal-subtitle').textContent = data.subtitle;
        
        const tabsContainer = document.getElementById('modal-tabs');
        tabsContainer.innerHTML = '';
        const contentContainer = document.getElementById('modal-tab-content');
        contentContainer.innerHTML = '';
        const footerContainer = document.getElementById('modal-footer');
        footerContainer.innerHTML = '';

        if (accountId === 'rent') {
            const today = new Date();
            const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
            renderRentModal(currentMonthStr);
        } else if (accountId === 'totalEquity') {
            renderEquityModal();
        } else {
            const availableTabs = ['Transactions'];
            if (data.financingTerms) {
                availableTabs.push('Financing Terms', 'Amortization');
            }

            availableTabs.forEach((tabName, index) => {
                const tab = document.createElement('button');
                tab.className = `tab text-sm font-semibold p-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 ${index === 0 ? 'active' : ''}`;
                tab.textContent = tabName;
                tab.dataset.tabContentId = tabName.toLowerCase().replace(/\s+/g, '-');
                tabsContainer.appendChild(tab);
            });

            tabsContainer.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    tabsContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    renderTabContent(accountId, tab.dataset.tabContentId);
                });
            });

            renderTabContent(accountId, availableTabs[0].toLowerCase().replace(/\s+/g, '-'));
        }

        modal.classList.remove('hidden');
        setTimeout(() => {
            modalBg.classList.remove('opacity-0');
            modalContent.classList.remove('scale-95', 'opacity-0');
        }, 10);
    }

    function closeModal() {
        modalBg.classList.add('opacity-0');
        modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }

    modalBg.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);

    function renderTabContent(accountId, tabId) {
        const data = accountsData[accountId];
        const contentContainer = document.getElementById('modal-tab-content');
        const footerContainer = document.getElementById('modal-footer');
        let html = '';
        footerContainer.innerHTML = ''; // Clear footer

        switch (tabId) {
            case 'transactions':
                html = `
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm text-left">
                            <thead class="bg-slate-50 text-xs text-slate-700 uppercase">
                                <tr>
                                    <th class="px-2 py-3">Date</th>
                                    <th class="px-2 py-3">Description</th>
                                    <th class="px-2 py-3 text-right">Debit (In)</th>
                                    <th class="px-2 py-3 text-right">Credit (Out)</th>
                                    <th class="px-2 py-3"></th>
                                </tr>
                            </thead>
                            <tbody id="transaction-table-body">
                                ${data.transactions.map(tx => createTransactionRow(tx)).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                footerContainer.innerHTML = `
                    <div class="flex justify-between">
                        <button id="add-tx-btn" class="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">Add Transaction</button>
                        <button id="save-tx-btn" class="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Save Changes</button>
                    </div>
                `;
                break;
            case 'financing-terms':
                const terms = data.financingTerms;
                let breakdownHtml = '';
                if (terms.breakdown) {
                    breakdownHtml = Object.entries(terms.breakdown).map(([key, value]) => `
                        <div class="bg-slate-100 p-4 rounded-lg">
                            <p class="text-sm text-slate-500">Principal (${key})</p>
                            <p class="text-2xl font-bold text-slate-800">${formatCurrency(value)}</p>
                        </div>
                    `).join('');
                } else {
                     breakdownHtml = `<div class="bg-slate-100 p-4 rounded-lg">
                            <p class="text-sm text-slate-500">Principal</p>
                            <p class="text-2xl font-bold text-slate-800">${formatCurrency(terms.principal)}</p>
                        </div>`;
                }

                html = `
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
                        ${breakdownHtml}
                        <div class="bg-slate-100 p-4 rounded-lg">
                            <p class="text-sm text-slate-500">Interest Rate</p>
                            <p class="text-2xl font-bold text-slate-800">${terms.interestRate.toFixed(2)}%</p>
                        </div>
                        <div class="bg-slate-100 p-4 rounded-lg">
                            <p class="text-sm text-slate-500">Term</p>
                            <p class="text-2xl font-bold text-slate-800">${terms.termYears} Years</p>
                        </div>
                    </div>
                `;
                break;
            case 'amortization':
                html = generateAmortizationTable(data.financingTerms);
                break;
        }
        contentContainer.innerHTML = html;
        if (tabId === 'transactions') {
            attachTransactionButtonListeners();
        }
    }
    
    function createTransactionRow(tx = { date: new Date().toISOString().split('T')[0], description: '', debit: 0, credit: 0 }) {
        return `
            <tr class="bg-white border-b transaction-row">
                <td class="px-2 py-2"><input type="date" class="tx-date w-full border rounded p-1" value="${tx.date}"></td>
                <td class="px-2 py-2"><input type="text" class="tx-desc w-full border rounded p-1" value="${tx.description}"></td>
                <td class="px-2 py-2"><input type="number" step="0.01" class="tx-debit w-full border rounded p-1 text-right" value="${tx.debit}"></td>
                <td class="px-2 py-2"><input type="number" step="0.01" class="tx-credit w-full border rounded p-1 text-right" value="${tx.credit}"></td>
                <td class="px-2 py-2 text-center"><button class="delete-tx-btn text-red-500 hover:text-red-700 font-bold text-xl">&times;</button></td>
            </tr>
        `;
    }

    function attachTransactionButtonListeners() {
        document.getElementById('add-tx-btn').addEventListener('click', () => {
            const tableBody = document.getElementById('transaction-table-body');
            tableBody.insertAdjacentHTML('beforeend', createTransactionRow());
            attachDeleteListeners();
        });

        document.getElementById('save-tx-btn').addEventListener('click', () => {
            const accountId = modal.dataset.currentAccount;
            const newTransactions = [];
            document.querySelectorAll('#transaction-table-body .transaction-row').forEach(row => {
                newTransactions.push({
                    date: row.querySelector('.tx-date').value,
                    description: row.querySelector('.tx-desc').value,
                    debit: parseFloat(row.querySelector('.tx-debit').value) || 0,
                    credit: parseFloat(row.querySelector('.tx-credit').value) || 0,
                });
            });
            accountsData[accountId].transactions = newTransactions;
            recalculateBalance(accountId);
            updateDashboardBalances();
            closeModal();
        });
        
        attachDeleteListeners();
    }
    
    function attachDeleteListeners() {
        document.querySelectorAll('.delete-tx-btn').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true)); // Remove old listeners
        });
        document.querySelectorAll('.delete-tx-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.transaction-row').remove();
            });
        });
    }

    function recalculateBalance(accountId) {
        const account = accountsData[accountId];
        if (account.type === 'personal') return;

        let balance = 0;
        const transactions = account.transactions;

        if (account.type === 'asset') {
            balance = transactions.reduce((acc, tx) => acc + tx.debit - tx.credit, 0);
        } else if (account.type === 'liability') {
            balance = transactions.reduce((acc, tx) => acc - tx.debit + tx.credit, 0);
        }
        account.balance = balance;
    }

    function renderRentModal(monthStr) {
        const contentContainer = document.getElementById('modal-tab-content');
        const footerContainer = document.getElementById('modal-footer');
        const tabsContainer = document.getElementById('modal-tabs');
        
        let currentMonth = new Date(monthStr + '-02'); // Use day 2 to avoid timezone issues
        
        let monthRecord = accountsData.rent.monthlyRecords.find(r => r.month === monthStr);
        if (!monthRecord) {
            const lastRecord = accountsData.rent.monthlyRecords[accountsData.rent.monthlyRecords.length - 1];
            monthRecord = {
                month: monthStr,
                tenants: lastRecord.tenants.map(t => ({...t, due: 0, received: 0}))
            };
            accountsData.rent.monthlyRecords.push(monthRecord);
            accountsData.rent.monthlyRecords.sort((a,b) => a.month.localeCompare(b.month));
        }

        const monthDisplay = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
        tabsContainer.innerHTML = `
            <div class="flex justify-between items-center w-full">
                <button id="prev-month-btn" class="px-3 py-1 bg-slate-200 rounded-md hover:bg-slate-300">&lt; Prev</button>
                <span class="font-bold text-lg">${monthDisplay}</span>
                <button id="next-month-btn" class="px-3 py-1 bg-slate-200 rounded-md hover:bg-slate-300">Next &gt;</button>
            </div>
        `;

        const floors = ['3rd Floor', '2nd Floor', '1st Floor', 'Barn'];
        let tenantsHtml = '';

        floors.forEach(floor => {
            const tenantsOnFloor = accountsData.rent.baseTenants.filter(t => t.floor === floor);
            if (tenantsOnFloor.length > 0) {
                let floorSubtotal = 0;
                tenantsHtml += `
                    <div class="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h3 class="text-lg font-bold text-slate-800 mb-3">${floor}</h3>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm text-left">
                                <thead class="bg-slate-200 text-xs text-slate-700 uppercase">
                                    <tr>
                                        <th class="px-2 py-2">Renter</th>
                                        <th class="px-2 py-2 text-right">Monthly Rent</th>
                                        <th class="px-2 py-2 text-right">$ Due</th>
                                        <th class="px-2 py-2 text-right">$ Received</th>
                                    </tr>
                                </thead>
                                <tbody>
                `;

                tenantsOnFloor.forEach(baseTenant => {
                    const tenantData = monthRecord.tenants.find(t => t.id === baseTenant.id) || { monthlyRent: 'TBD', due: 0, received: 0 };
                    let monthlyRentValue = tenantData.monthlyRent === 'TBD' ? '' : tenantData.monthlyRent;
                    let monthlyRentPlaceholder = tenantData.monthlyRent === 'TBD' ? 'TBD' : '0.00';
                    const rent = parseFloat(tenantData.monthlyRent);
                    if (!isNaN(rent)) {
                        floorSubtotal += rent;
                    }
                    tenantsHtml += `
                        <tr class="bg-white border-b tenant-row" data-tenant-id="${baseTenant.id}">
                            <td class="px-2 py-2"><input type="text" value="${baseTenant.renter}" class="w-full border rounded p-1 rent-renter"></td>
                            <td class="px-2 py-2"><input type="text" value="${monthlyRentValue}" placeholder="${monthlyRentPlaceholder}" class="w-full border rounded p-1 text-right rent-monthly"></td>
                            <td class="px-2 py-2"><input type="number" step="0.01" value="${tenantData.due}" class="w-full border rounded p-1 text-right rent-due"></td>
                            <td class="px-2 py-2"><input type="number" step="0.01" value="${tenantData.received}" class="w-full border rounded p-1 text-right rent-received"></td>
                        </tr>
                    `;
                });

                tenantsHtml += `
                                    <tr class="bg-slate-100 font-bold">
                                        <td class="px-2 py-2 text-right" colspan="1">Sub-total</td>
                                        <td class="px-2 py-2 text-right">${formatCurrency(floorSubtotal)}</td>
                                        <td class="px-2 py-2"></td>
                                        <td class="px-2 py-2"></td>
                                    </tr>
                                </tbody></table></div></div>
                `;
            }
        });

        const totalMonthlyRent = monthRecord.tenants.reduce((total, tenant) => {
            const rent = parseFloat(tenant.monthlyRent);
            return total + (isNaN(rent) ? 0 : rent);
        }, 0);

        tenantsHtml += `
            <div class="mt-6 p-4 bg-blue-100 rounded-lg border border-blue-200">
                <div class="flex justify-end items-center">
                    <h4 class="font-bold text-lg text-blue-800 mr-4">Total Monthly Rent:</h4>
                    <p class="text-xl font-bold text-blue-900">${formatCurrency(totalMonthlyRent)}</p>
                </div>
            </div>
        `;

        contentContainer.innerHTML = `<div id="rent-roll-editor">${tenantsHtml}</div>`;
        footerContainer.innerHTML = `
            <div class="flex justify-end">
                <button id="save-rent-btn" class="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Save Changes</button>
            </div>
        `;
        
        document.getElementById('prev-month-btn').addEventListener('click', () => {
            currentMonth.setMonth(currentMonth.getMonth() - 1);
            const newMonthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
            renderRentModal(newMonthStr);
        });
        
        document.getElementById('next-month-btn').addEventListener('click', () => {
            currentMonth.setMonth(currentMonth.getMonth() + 1);
            const newMonthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
            renderRentModal(newMonthStr);
        });

        document.getElementById('save-rent-btn').addEventListener('click', () => {
            const currentRecord = accountsData.rent.monthlyRecords.find(r => r.month === monthStr);
            let totalRent = 0;
            
            document.querySelectorAll('.tenant-row').forEach(row => {
                const tenantId = parseInt(row.dataset.tenantId);
                const baseTenant = accountsData.rent.baseTenants.find(t => t.id === tenantId);
                baseTenant.renter = row.querySelector('.rent-renter').value;

                const tenantRecord = currentRecord.tenants.find(t => t.id === tenantId);
                const monthlyRentVal = row.querySelector('.rent-monthly').value;
                tenantRecord.monthlyRent = monthlyRentVal === '' || isNaN(parseFloat(monthlyRentVal)) ? "TBD" : parseFloat(monthlyRentVal);
                tenantRecord.due = parseFloat(row.querySelector('.rent-due').value) || 0;
                tenantRecord.received = parseFloat(row.querySelector('.rent-received').value) || 0;
                
                if (typeof tenantRecord.monthlyRent === 'number') {
                    totalRent += tenantRecord.monthlyRent;
                }
            });
            accountsData.rent.totalMonthlyRent = totalRent;
            updateDashboardBalances();
            closeModal();
        });
    }

    function renderEquityModal() {
        const contentContainer = document.getElementById('modal-tab-content');
        const ownersEquity = calculateTotalEquity();

        const totalAssets = Object.values(accountsData)
            .filter(acc => acc.type === 'asset')
            .reduce((sum, acc) => sum + acc.balance, 0);

        const totalLiabilities = Object.values(accountsData)
            .filter(acc => acc.type === 'liability')
            .reduce((sum, acc) => sum + acc.balance, 0);

        contentContainer.innerHTML = `
            <div class="space-y-4 text-center">
                <div class="bg-green-50 p-4 rounded-lg">
                    <p class="text-sm text-green-700">Total Assets</p>
                    <p class="text-3xl font-bold text-green-900">${formatCurrency(totalAssets)}</p>
                </div>
                <p class="text-2xl font-bold text-slate-500">-</p>
                <div class="bg-rose-50 p-4 rounded-lg">
                    <p class="text-sm text-rose-700">Total Liabilities</p>
                    <p class="text-3xl font-bold text-rose-900">${formatCurrency(totalLiabilities)}</p>
                </div>
                <p class="text-2xl font-bold text-slate-500">=</p>
                <div class="bg-indigo-50 p-4 rounded-lg">
                    <p class="text-sm text-indigo-700">Owner's Equity</p>
                    <p class="text-3xl font-bold text-indigo-900">${formatCurrency(ownersEquity)}</p>
                </div>
            </div>
        `;
    }

    function generateAmortizationTable(terms) {
        const { principal, interestRate, termYears } = terms;
        const monthlyRate = interestRate / 100 / 12;
        const numberOfPayments = termYears * 12;
        const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

        let tableHtml = `
            <div class="mb-4 text-center">
                <p class="text-sm text-slate-500">Calculated Monthly Payment</p>
                <p class="text-2xl font-bold text-indigo-600">${formatCurrency(monthlyPayment)}</p>
            </div>
            <div class="overflow-auto max-h-96">
                <table class="w-full text-sm text-left">
                    <thead class="bg-slate-50 text-xs text-slate-700 uppercase sticky top-0">
                        <tr>
                            <th class="px-4 py-3">Pmt #</th>
                            <th class="px-4 py-3 text-right">Principal</th>
                            <th class="px-4 py-3 text-right">Interest</th>
                            <th class="px-4 py-3 text-right">Remaining Balance</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        let remainingBalance = principal;
        for (let i = 1; i <= numberOfPayments; i++) {
            const interest = remainingBalance * monthlyRate;
            const principalPayment = monthlyPayment - interest;
            remainingBalance -= principalPayment;
            tableHtml += `
                <tr class="bg-white border-b">
                    <td class="px-4 py-2">${i}</td>
                    <td class="px-4 py-2 text-right">${formatCurrency(principalPayment)}</td>
                    <td class="px-4 py-2 text-right">${formatCurrency(interest)}</td>
                    <td class="px-4 py-2 text-right font-medium">${formatCurrency(Math.abs(remainingBalance))}</td>
                </tr>`;
        }
        
        tableHtml += `</tbody></table></div>`;
        return tableHtml;
    }
    
    const navLinks = document.querySelectorAll('header a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    updateDashboardBalances();

    // --- Plaid Integration --- 
    const connectBankBtn = document.getElementById('connect-bank-btn');
    const statusContainer = document.getElementById('plaid-connection-status');
    const apiBase = 'http://localhost:8000'
    async function createLinkToken() {
        const resp = await fetch(`${apiBase}/plaid/link-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', "x-api-key": "dev-123"},
            body: JSON.stringify({ userId: 'custom_test' })
        });
        const data = await resp.json();
        if (!resp.ok) throw data.error || data;
        return data.link_token;
    }

    async function exchangePublicToken(public_token) {
        const resp = await fetch(`${apiBase}/plaid/exchange`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', "x-api-key": "dev-123"},
            body: JSON.stringify({ public_token })
        });
        const data = await resp.json();
        if (!resp.ok) throw data.error || data;
        return data.item_id;
    }

    async function fetchBalances() {
        const resp = await fetch(`${apiBase}/plaid/refresh-balances`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', "x-api-key": "dev-123" }});
        const data = await resp.json();
        if (!resp.ok) throw data.error || data;
        return data.accounts || [];
    }

    connectBankBtn.addEventListener('click', async () => {
        connectBankBtn.disabled = true;
        connectBankBtn.textContent = 'Connecting...';

        try {
            const linkToken = await createLinkToken();

            const handler = Plaid.create({
            token: linkToken,
            onLoad: () => {},
            onSuccess: async (public_token, metadata) => {
                try {
                    await exchangePublicToken(public_token);

                    statusContainer.innerHTML = `
                        <div class="p-4 bg-green-100 border border-green-200 text-green-800 rounded-lg">
                        <p class="font-semibold">Connected to ${metadata?.institution?.name || 'your bank'}.</p>
                        <p>You can now refresh your balances.</p>
                        </div>
                        <button id="refresh-balances-btn" class="mt-4 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                        Refresh Balances
                        </button>
                    `;

                    const refreshBtn = document.getElementById('refresh-balances-btn');
                    refreshBtn.addEventListener('click', async () => {
                        refreshBtn.disabled = true;
                        refreshBtn.textContent = 'Refreshing...';
                        try {
                            const accounts = await fetchBalances();
                            console.log('Plaid accounts w/ balances:', accounts);

                            // Optional: sum balances and update your “LLC Checking” card
                            const sum = accounts.reduce((acc, a) => acc + (a?.current ?? 0), 0);

                            refreshBtn.disabled = false;
                            refreshBtn.textContent = 'Refresh Balances';
                            alert(`Balances refreshed. Total available: $${sum.toFixed(2)}`);
                        } catch (err) {
                            console.error('refresh error', err);
                            alert(readableErr(err));
                            refreshBtn.disabled = false;
                            refreshBtn.textContent = 'Refresh Balances';
                        }
                    });

                    connectBankBtn.style.display = 'none';
                } catch (err) {
                    console.error('exchange error', err);
                    alert(readableErr(err));
                    connectBankBtn.disabled = false;
                    connectBankBtn.textContent = 'Link Bank';
                }
            },
            onExit: (err, metadata) => {
                if (err) console.error('Link exit error:', err, metadata);
                connectBankBtn.disabled = false;
                connectBankBtn.textContent = 'Link Bank';
            },
            onEvent: (eventName, metadata) => {
                console.log('Plaid event:', eventName, metadata);
            }
            });

            handler.open();
        } catch (err) {
            console.error('link-token error', err);
            alert(readableErr(err));
            connectBankBtn.disabled = false;
            connectBankBtn.textContent = 'Link Bank';
        }
    });

    function readableErr(e) {
        if (!e) return 'Unknown error';
        if (typeof e === 'string') return e;
        if (e.error_code || e.error_message) {
            return `[${e.error_code}] ${e.error_message || e.display_message || 'Plaid error'}`;
        }
        return e.message || JSON.stringify(e);
    }
});
