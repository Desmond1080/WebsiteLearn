const adminNameEl = document.getElementById('admin-name');
const logoutButton = document.getElementById('admin-logout-button');
const logoutPopup = document.getElementById('logout-confirmation-popup');
// Chart instances (global for updates)
let appointmentStatusChart = null;
let monthlyTrendChart = null;
let doctorPerformanceChart = null;

// Store all appointments for filtering
let allAppointments = [];

// Format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Convert date string (yyyy-mm-dd) to Date object
function parseDate(dateStr) {
    return new Date(dateStr + 'T00:00:00');
}

// Check admin authentication
async function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }
        const userDoc = await db.collection('Users').doc(user.uid).get();
        if (!userDoc.exists) {
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }
        const userData = userDoc.data();
        if (userData?.role !== 'admin') {
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }
        if (adminNameEl) {
            adminNameEl.textContent = userData?.name || user.email;
        }
        loadReports();
    });
}

// Load all reports
async function loadReports(){
    try {
        console.log('Loading reports...');
        await Promise.all([
            loadSystemStats(),
            loadAppointmentStats(),
            loadDoctorPerformance(),
            loadUserStatistics(),
            loadSpecializationDistribution()
        ]);
        initializeCharts();
        console.log('All reports loaded successfully');
    } catch(error) {
        console.error('Error loading reports:', error);
    }
}

// Load System Overview Stats
async function loadSystemStats(){
    try {
        const usersSnap = await db.collection('Users').get();
        const doctorsSnap = await db.collection('Doctors').get();
        const appointmentsSnap = await db.collection('Appointments').get();
        
        // Total users (with role=user)
        const totalUsers = usersSnap.docs.filter(d => d.data().role === 'user').length;
        document.getElementById('total-users').textContent = formatNumber(totalUsers);
        
        // Total doctors
        const totalDoctors = doctorsSnap.size;
        document.getElementById('total-doctors').textContent = formatNumber(totalDoctors);
        
        // Total appointments
        const totalAppointments = appointmentsSnap.size;
        document.getElementById('total-appointments').textContent = formatNumber(totalAppointments);
        
        // This month appointments
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const monthAppointments = appointmentsSnap.docs.filter(doc => {
            const apptDate = doc.data().appointmentDate?.toDate?.() || new Date(doc.data().appointmentDate);
            return apptDate >= monthStart && apptDate <= monthEnd;
        }).length;
        
        document.getElementById('month-appointments').textContent = formatNumber(monthAppointments);
        
        // Store appointments for filtering
        allAppointments = appointmentsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            appointmentDate: doc.data().appointmentDate?.toDate?.() || new Date(doc.data().appointmentDate)
        }));
        
        console.log('System stats loaded:', { totalUsers, totalDoctors, totalAppointments, monthAppointments });
    } catch(error) {
        console.error('Error loading system stats:', error);
    }
}

// Load Appointment Statistics
async function loadAppointmentStats(){
    try {
        const appointmentsSnap = await db.collection('Appointments').get();
        
        // Count by status
        const statusCounts = {
            completed: 0,
            pending: 0,
            cancelled: 0,
            noshow: 0
        };
        
        appointmentsSnap.docs.forEach(doc => {
            const status = doc.data().status?.toLowerCase() || 'pending';
            if(status in statusCounts) {
                statusCounts[status]++;
            }
        });
        
        // Render status breakdown
        const statusContainer = document.getElementById('appointment-status-breakdown');
        const statusLabels = {
            completed: 'Completed',
            pending: 'Pending',
            cancelled: 'Cancelled',
            noshow: 'No Show'
        };
        
        let statusHTML = '';
        for(let [status, count] of Object.entries(statusCounts)) {
            statusHTML += `
                <div class="status-item ${status}">
                    <span class="status-label">${statusLabels[status]}</span>
                    <span class="status-count">${count}</span>
                    <div class="status-color"></div>
                </div>
            `;
        }
        statusContainer.innerHTML = statusHTML;
        
        console.log('Appointment stats loaded:', statusCounts);
    } catch(error) {
        console.error('Error loading appointment stats:', error);
    }
}

// Load Doctor Performance
async function loadDoctorPerformance(){
    try {
        const appointmentsSnap = await db.collection('Appointments').get();
        const doctorsSnap = await db.collection('Users').where('role', '==', 'doctor').get();
        
        // Count appointments per doctor
        const doctorCounts = {};
        appointmentsSnap.docs.forEach(doc => {
            const doctorId = doc.data().doctorId;
            if(doctorId) {
                doctorCounts[doctorId] = (doctorCounts[doctorId] || 0) + 1;
            }
        });
        
        // Get doctor names and sort by count
        const doctorList = [];
        for(let doctor of doctorsSnap.docs) {
            const count = doctorCounts[doctor.id] || 0;
            doctorList.push({
                id: doctor.id,
                name: doctor.data().name,
                specialization: doctor.data().specialization,
                count: count
            });
        }
        
        // Sort by appointment count (descending)
        doctorList.sort((a, b) => b.count - a.count);
        
        // Render doctor list
        const doctorContainer = document.getElementById('doctor-appointments-list');
        let doctorHTML = '';
        
        if(doctorList.length === 0) {
            doctorHTML = '<p style="text-align: center; color: #94a3b8; padding: 40px 0;">No doctors found</p>';
        } else {
            doctorList.forEach(doctor => {
                doctorHTML += `
                    <div class="doctor-item">
                        <div class="doctor-info">
                            <h4>${doctor.name}</h4>
                            <p>${doctor.specialization || 'General'}</p>
                        </div>
                        <div class="doctor-count">${doctor.count} appointments</div>
                    </div>
                `;
            });
        }
        
        doctorContainer.innerHTML = doctorHTML;
        console.log('Doctor performance loaded:', doctorList);
    } catch(error) {
        console.error('Error loading doctor performance:', error);
    }
}

// Load User Statistics
async function loadUserStatistics(){
    try {
        const usersSnap = await db.collection('Users').where('role', '==', 'user').get();
        
        // Total patients
        const totalPatients = usersSnap.size;
        
        // Gender distribution
        const genderCounts = {
            male: 0,
            female: 0,
            other: 0
        };
        
        usersSnap.docs.forEach(doc => {
            const gender = doc.data().gender?.toLowerCase() || 'other';
            if(gender === 'male') genderCounts.male++;
            else if(gender === 'female') genderCounts.female++;
            else genderCounts.other++;
        });
        
        // Render user statistics
        const userStatsContainer = document.getElementById('user-statistics');
        let userStatsHTML = `
            <div class="user-stat-row">
                <span class="user-stat-label"><i class="fas fa-users"></i> Total Registered Patients</span>
                <span class="user-stat-value">${formatNumber(totalPatients)}</span>
            </div>
            <div class="user-stat-row">
                <span class="user-stat-label"><i class="fas fa-mars"></i> Male Patients</span>
                <span class="user-stat-value">${genderCounts.male}</span>
            </div>
            <div class="user-stat-row">
                <span class="user-stat-label"><i class="fas fa-venus"></i> Female Patients</span>
                <span class="user-stat-value">${genderCounts.female}</span>
            </div>
            <div class="user-stat-row">
                <span class="user-stat-label"><i class="fas fa-question-circle"></i> Other</span>
                <span class="user-stat-value">${genderCounts.other}</span>
            </div>
        `;
        
        userStatsContainer.innerHTML = userStatsHTML;
        console.log('User statistics loaded:', { totalPatients, genderCounts });
    } catch(error) {
        console.error('Error loading user statistics:', error);
    }
}

// Load Specialization Distribution
async function loadSpecializationDistribution(){
    try {
        const doctorsSnap = await db.collection('Doctors').get();
        
        // Count by specialization
        const specializationCounts = {};
        doctorsSnap.docs.forEach(doc => {
            const spec = doc.data().specialization || 'General';
            specializationCounts[spec] = (specializationCounts[spec] || 0) + 1;
        });
        
        // Sort by count (descending)
        const sorted = Object.entries(specializationCounts)
            .map(([spec, count]) => ({ spec, count }))
            .sort((a, b) => b.count - a.count);
        
        // Render specialization list
        const specContainer = document.getElementById('specialization-distribution');
        let specHTML = '';
        
        if(sorted.length === 0) {
            specHTML = '<p style="text-align: center; color: #94a3b8; padding: 40px 0;">No specializations found</p>';
        } else {
            sorted.forEach(item => {
                specHTML += `
                    <div class="specialization-item">
                        <h4>${item.spec}</h4>
                        <div class="specialization-count">${item.count} doctor${item.count !== 1 ? 's' : ''}</div>
                    </div>
                `;
            });
        }
        
        specContainer.innerHTML = specHTML;
        console.log('Specialization distribution loaded:', specializationCounts);
    } catch(error) {
        console.error('Error loading specialization distribution:', error);
    }
}

// Initialize Chart.js charts
function initializeCharts() {
    // Appointment Status Pie Chart
    const statusCtx = document.getElementById('appointmentStatusChart');
    if(statusCtx) {
        const statusData = getStatusData(allAppointments);
        appointmentStatusChart = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Pending', 'Cancelled', 'No Show'],
                datasets: [{
                    data: [statusData.completed, statusData.pending, statusData.cancelled, statusData.noshow],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
                    borderColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 12, family: "'Inter', sans-serif" },
                            padding: 15,
                            color: '#475569'
                        }
                    }
                }
            }
        });
    }

    // Monthly Trend Line Chart
    const trendCtx = document.getElementById('monthlyTrendChart');
    if(trendCtx) {
        const trendData = getMonthlyTrendData(allAppointments);
        monthlyTrendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: trendData.labels,
                datasets: [{
                    label: 'Appointments',
                    data: trendData.counts,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: {
                            font: { size: 12, family: "'Inter', sans-serif" },
                            color: '#475569'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: { size: 11, family: "'Inter', sans-serif" },
                            color: '#64748b'
                        },
                        grid: { color: '#e2e8f0' }
                    },
                    x: {
                        ticks: {
                            font: { size: 11, family: "'Inter', sans-serif" },
                            color: '#64748b'
                        },
                        grid: { color: '#e2e8f0' }
                    }
                }
            }
        });
    }

    // Doctor Performance Bar Chart
    const doctorCtx = document.getElementById('doctorPerformanceChart');
    if(doctorCtx) {
        const doctorData = getDoctorPerformanceData(allAppointments);
        doctorPerformanceChart = new Chart(doctorCtx, {
            type: 'bar',
            data: {
                labels: doctorData.labels,
                datasets: [{
                    label: 'Appointments',
                    data: doctorData.counts,
                    backgroundColor: '#764ba2',
                    borderColor: '#764ba2',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: {
                            font: { size: 12, family: "'Inter', sans-serif" },
                            color: '#475569'
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            font: { size: 11, family: "'Inter', sans-serif" },
                            color: '#64748b'
                        },
                        grid: { color: '#e2e8f0' }
                    },
                    y: {
                        ticks: {
                            font: { size: 11, family: "'Inter', sans-serif" },
                            color: '#64748b'
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    }
}

// Get status data for pie chart
function getStatusData(appointments) {
    const data = { completed: 0, pending: 0, cancelled: 0, noshow: 0 };
    appointments.forEach(apt => {
        const status = apt.status?.toLowerCase() || 'pending';
        if(status in data) data[status]++;
    });
    return data;
}

// Get monthly trend data
function getMonthlyTrendData(appointments) {
    const monthData = {};
    const now = new Date();
    
    // Initialize last 6 months
    for(let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        monthData[key] = 0;
    }
    
    // Count appointments by month
    appointments.forEach(apt => {
        const d = apt.appointmentDate;
        if(d instanceof Date && !isNaN(d)) {
            const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            if(key in monthData) monthData[key]++;
        }
    });
    
    return {
        labels: Object.keys(monthData),
        counts: Object.values(monthData)
    };
}

// Get doctor performance data
async function getDoctorPerformanceData(appointments) {
    const doctorCounts = {};
    const doctorNames = {};
    
    // Get all doctors
    const doctorsSnap = await db.collection('Users').where('role', '==', 'doctor').get();
    doctorsSnap.docs.forEach(doc => {
        doctorNames[doc.id] = doc.data().name;
    });
    
    // Count appointments per doctor
    appointments.forEach(apt => {
        const doctorId = apt.doctorId;
        if(doctorId && doctorNames[doctorId]) {
            doctorCounts[doctorId] = (doctorCounts[doctorId] || 0) + 1;
        }
    });
    
    // Sort by count (descending) and get top 10
    const sorted = Object.entries(doctorCounts)
        .map(([id, count]) => ({ name: doctorNames[id], count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    
    return {
        labels: sorted.map(d => d.name),
        counts: sorted.map(d => d.count)
    };
}

// Initialize date input restrictions
function initializeDateInputs() {
    const today = new Date().toISOString().split('T')[0];
    const startDateInput = document.getElementById('filter-start-date');
    const endDateInput = document.getElementById('filter-end-date');
    
    if(startDateInput) {
        startDateInput.max = today;
    }
    if(endDateInput) {
        endDateInput.max = today;
    }
}

// Apply date filter to reports
async function applyDateFilter() {
    const startDateInput = document.getElementById('filter-start-date')?.value;
    const endDateInput = document.getElementById('filter-end-date')?.value;
    
    if(!startDateInput || !endDateInput) {
        alert('Please select both start and end dates');
        return;
    }
    
    const startDate = parseDate(startDateInput);
    const endDate = parseDate(endDateInput);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if(startDate > endDate) {
        alert('Start date must be before end date');
        return;
    }
    
    if(endDate > today) {
        alert('End date cannot be in the future');
        return;
    }
    
    // Filter appointments
    const filteredAppointments = allAppointments.filter(apt => {
        const apptDate = apt.appointmentDate;
        return apptDate >= startDate && apptDate <= endDate;
    });
    
    // Update charts
    updateCharts(filteredAppointments);
    
    // Update filter info
    const filterInfo = document.getElementById('filter-info-text');
    if(filterInfo) {
        const formattedStart = new Date(startDateInput).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const formattedEnd = new Date(endDateInput).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        filterInfo.textContent = `Showing data from ${formattedStart} to ${formattedEnd} (${filteredAppointments.length} appointments)`;
    }
    
    console.log(`Filtered to ${filteredAppointments.length} appointments between ${startDateInput} and ${endDateInput}`);
}

// Reset date filter
function resetDateFilter() {
    const startDateInput = document.getElementById('filter-start-date');
    const endDateInput = document.getElementById('filter-end-date');
    const filterInfo = document.getElementById('filter-info-text');
    
    if(startDateInput) startDateInput.value = '';
    if(endDateInput) endDateInput.value = '';
    
    if(filterInfo) {
        filterInfo.textContent = 'Showing all data';
    }
    
    // Reset charts to show all data
    updateCharts(allAppointments);
    console.log('Date filter reset - showing all appointments');
}

// Export appointment status data to CSV
function exportAppointmentStatus() {
    const statusData = getStatusData(allAppointments);
    const csvContent = "data:text/csv;charset=utf-8,Status,Count\n" +
        `Completed,${statusData.completed}\n` +
        `Pending,${statusData.pending}\n` +
        `Cancelled,${statusData.cancelled}\n` +
        `No Show,${statusData.noshow}`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "appointment_status.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('Exported appointment status data to CSV');
}

// Update all charts with filtered data
function updateCharts(appointments) {
    if(appointmentStatusChart) {
        const statusData = getStatusData(appointments);
        appointmentStatusChart.data.datasets[0].data = [
            statusData.completed,
            statusData.pending,
            statusData.cancelled,
            statusData.noshow
        ];
        appointmentStatusChart.update();
    }
    
    if(monthlyTrendChart) {
        const trendData = getMonthlyTrendData(appointments);
        monthlyTrendChart.data.labels = trendData.labels;
        monthlyTrendChart.data.datasets[0].data = trendData.counts;
        monthlyTrendChart.update();
    }
    
    if(doctorPerformanceChart) {
        getDoctorPerformanceData(appointments).then(doctorData => {
            doctorPerformanceChart.data.labels = doctorData.labels;
            doctorPerformanceChart.data.datasets[0].data = doctorData.counts;
            doctorPerformanceChart.update();
        });
    }
}

// Logout functionality
function showLogoutConfirmation(){
    if(logoutPopup){
        logoutPopup.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }
}

function cancelLogout(){
    if(logoutPopup){
        logoutPopup.classList.remove('visible');
        document.body.style.overflow = 'auto';
    }
}

async function confirmLogout(){
    try {
        await auth.signOut();
        localStorage.removeItem('userRole');
        window.location.href = '../User/UserLoginAndRegister.html';
    } catch(error) {
        console.error('Logout error:', error);
    }
}

if(logoutButton){
    logoutButton.addEventListener('click', (event) => {
        event.preventDefault();
        showLogoutConfirmation();
    });
}

function setActiveNavLink(){
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.navbar-menu .nav-link').forEach((link) => {
        const href = link.getAttribute('href');
        if(!href) return;
        const linkPage = new URL(href, window.location.origin).pathname.split('/').pop();
        if(linkPage === currentPage){
            link.classList.add('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setActiveNavLink();
    initializeDateInputs();
    checkAuthState();
});
