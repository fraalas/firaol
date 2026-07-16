// ─── Sanchos CRM — Amharic + English translations ────────────────────────────

export type Locale = 'en' | 'am'

export const translations = {
  en: {
    // Navigation
    dashboard:    'Dashboard',
    leads:        'Leads',
    properties:   'Properties',
    activities:   'Activities',
    reports:      'Reports',
    profile:      'Profile',
    admin:        'Admin',
    settings:     'Settings',
    logout:       'Logout',

    // Auth
    welcomeBack:       'Welcome Back!',
    loginToAccount:    'Login to your account',
    createAccount:     'Create Your Account',
    joinCRM:           'Join Sanchos Real Estate CRM',
    email:             'Email address',
    password:          'Password',
    fullName:          'Full Name',
    phone:             'Phone Number',
    role:              'Role',
    rememberMe:        'Remember me',
    forgotPassword:    'Forgot Password?',
    login:             'Login',
    signUp:            'Sign Up',
    noAccount:         "Don't have an account?",
    haveAccount:       'Already have an account?',
    resetPassword:     'Reset Password',
    sendResetLink:     'Send Reset Link',

    // Dashboard
    helloAdmin:        'Hello',
    happeningToday:    "Here's what's happening today.",
    thisMonth:         'This Month',
    totalLeads:        'Total Leads',
    newLeads:          'New Leads',
    closedDeals:       'Closed Deals',
    convRate:          'Conv. Rate',
    recentLeads:       'Recent Leads',
    viewAll:           'View All',
    pipelineStage:     'Leads by Pipeline Stage',

    // Leads
    addLead:           'Add Lead',
    searchLeads:       'Search leads...',
    fullNameLabel:     'Full Name',
    locationLabel:     'Location',
    budgetLabel:       'Budget ($)',
    interestLabel:     'Interest',
    sourceLabel:       'Source',
    stageLabel:        'Stage',
    saveLead:          'Save Lead',
    deleteLead:        'Delete Lead?',
    deleteLeadMsg:     'This will permanently delete this lead.',
    noLeads:           'No leads found.',

    // Lead stages
    newLead:       'New Lead',
    contacted:     'Contacted',
    interested:    'Interested',
    propVisit:     'Property Visit',
    negotiation:   'Negotiation',
    closed:        'Closed',
    lost:          'Lost',

    // Properties
    addProperty:   'Add Property',
    searchProps:   'Search properties...',
    forSale:       'For Sale',
    forRent:       'For Rent',
    sold:          'Sold',
    available:     'Available',
    rented:        'Rented',
    bedrooms:      'Bedrooms',
    bathrooms:     'Bathrooms',
    area:          'Area (m²)',
    price:         'Price',
    description:   'Description',
    saveProperty:  'Save Property',

    // Activities
    scheduleActivity: 'Schedule Activity',
    title:            'Title',
    type:             'Type',
    dateTime:         'Date & Time',
    notes:            'Notes',
    saveActivity:     'Save Activity',
    noActivities:     'No activities scheduled.',

    // Reports
    totalRevenue:     'Pipeline Value',
    conversion:       'Conversion Rate',
    monthlyTrend:     'Monthly Lead Trend',
    leadSources:      'Lead Sources',
    actBreakdown:     'Activity Breakdown',

    // Profile
    personalInfo:     'Personal Info',
    save:             'Save',
    saved:            'Saved!',
    notifications:    'Notifications',
    changePassword:   'Change Password',
    signOut:          'Sign out',
    myLeads:          'My Leads',

    // Export
    exportLeads:      'Export Leads',
    exportExcel:      'Export to Excel',
    exportPDF:        'Export to PDF',
    exportSuccess:    'Export complete',

    // Notifications
    notifyAll:        'Notify All Agents',
    newLeadAlert:     'New Lead Alert',
    activityReminder: 'Activity Reminder',
  },

  am: {
    // Navigation
    dashboard:    'ዳሽቦርድ',
    leads:        'ደንበኞች',
    properties:   'ንብረቶች',
    activities:   'እንቅስቃሴዎች',
    reports:      'ሪፖርቶች',
    profile:      'መገለጫ',
    admin:        'አስተዳዳሪ',
    settings:     'ቅንብሮች',
    logout:       'ውጣ',

    // Auth
    welcomeBack:       'እንኳን ደህና መጡ!',
    loginToAccount:    'ወደ መለያዎ ይግቡ',
    createAccount:     'መለያ ይፍጠሩ',
    joinCRM:           'ወደ ሳንቾስ ሪል እስቴት CRM ይቀላቀሉ',
    email:             'ኢሜይል አድራሻ',
    password:          'የይለፍ ቃል',
    fullName:          'ሙሉ ስም',
    phone:             'ስልክ ቁጥር',
    role:              'ሚና',
    rememberMe:        'አስታወስ',
    forgotPassword:    'የይለፍ ቃሉን ረሱ?',
    login:             'ግባ',
    signUp:            'ይመዝገቡ',
    noAccount:         'መለያ የለዎትም?',
    haveAccount:       'መለያ አለዎት?',
    resetPassword:     'የይለፍ ቃል ዳግም ያስጀምሩ',
    sendResetLink:     'የዳግም መጀመሪያ ማስፈንጠሪያ ላክ',

    // Dashboard
    helloAdmin:        'ሰላም',
    happeningToday:    'ዛሬ የሚሆነው ይኸውና።',
    thisMonth:         'ይህ ወር',
    totalLeads:        'ጠቅላላ ደንበኞች',
    newLeads:          'አዲስ ደንበኞች',
    closedDeals:       'የተዘጉ ስምምነቶች',
    convRate:          'የሽቀጣ ምጣኔ',
    recentLeads:       'የቅርብ ጊዜ ደንበኞች',
    viewAll:           'ሁሉንም ይመልከቱ',
    pipelineStage:     'ደንበኞች በቧንቧ መስመር ደረጃ',

    // Leads
    addLead:           'ደንበኛ ጨምር',
    searchLeads:       'ደንበኞችን ፈልግ...',
    fullNameLabel:     'ሙሉ ስም',
    locationLabel:     'ቦታ',
    budgetLabel:       'በጀት ($)',
    interestLabel:     'ፍላጎት',
    sourceLabel:       'ምንጭ',
    stageLabel:        'ደረጃ',
    saveLead:          'ደንበኛ አስቀምጥ',
    deleteLead:        'ደንበኛ ሰርዝ?',
    deleteLeadMsg:     'ይህ ደንበኛ ዶሮ ስርዝ ይሆናል።',
    noLeads:           'ደንበኞች አልተገኙም።',

    // Lead stages
    newLead:       'አዲስ ደንበኛ',
    contacted:     'ተነጋግሯል',
    interested:    'ፍላጎት አለው',
    propVisit:     'ቦታ ጎበኘ',
    negotiation:   'ድርድር',
    closed:        'ተዘጋ',
    lost:          'ጠፋ',

    // Properties
    addProperty:   'ንብረት ጨምር',
    searchProps:   'ንብረቶችን ፈልግ...',
    forSale:       'ለሽያጭ',
    forRent:       'ለኪራይ',
    sold:          'ተሸጠ',
    available:     'ይገኛል',
    rented:        'ተከራይቷል',
    bedrooms:      'መኝታ ቤቶች',
    bathrooms:     'መታጠቢያ ቤቶች',
    area:          'ስፋት (ሜ²)',
    price:         'ዋጋ',
    description:   'መግለጫ',
    saveProperty:  'ንብረት አስቀምጥ',

    // Activities
    scheduleActivity: 'እንቅስቃሴ ዕቅድ',
    title:            'ርዕስ',
    type:             'አይነት',
    dateTime:         'ቀን እና ሰዓት',
    notes:            'ማስታወሻዎች',
    saveActivity:     'እንቅስቃሴ አስቀምጥ',
    noActivities:     'ምንም እንቅስቃሴ አልተቀደደም።',

    // Reports
    totalRevenue:     'የቧንቧ ዋጋ',
    conversion:       'የሽቀጣ ምጣኔ',
    monthlyTrend:     'ወርሃዊ የደንበኛ አዝማሚያ',
    leadSources:      'የደንበኛ ምንጮች',
    actBreakdown:     'የእንቅስቃሴ ዝርዝር',

    // Profile
    personalInfo:     'የግል መረጃ',
    save:             'አስቀምጥ',
    saved:            'ተቀምጧል!',
    notifications:    'ማሳወቂያዎች',
    changePassword:   'የይለፍ ቃል ቀይር',
    signOut:          'ውጣ',
    myLeads:          'የእኔ ደንበኞች',

    // Export
    exportLeads:      'ደንበኞችን ላክ',
    exportExcel:      'ወደ Excel ላክ',
    exportPDF:        'ወደ PDF ላክ',
    exportSuccess:    'ልኬት ተጠናቋል',

    // Notifications
    notifyAll:        'ሁሉንም ወኪሎች አሳውቅ',
    newLeadAlert:     'አዲስ ደንበኛ ማሳወቂያ',
    activityReminder: 'የእንቅስቃሴ አስታዋሽ',
  }
} as const

export type TranslationKey = keyof typeof translations.en
