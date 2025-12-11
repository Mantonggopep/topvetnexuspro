// C:\USERS\ADMIN\DESKTOP\VET NEXUS PRO\utils\uiUtils.ts

export const getAvatarGradient = (name: string): string => {
    const gradients = [
        'from-pink-400 to-rose-500',
        'from-purple-400 to-indigo-500',
        'from-cyan-400 to-blue-500',
        'from-emerald-400 to-teal-500',
        'from-orange-400 to-amber-500',
        'from-indigo-400 to-cyan-500',
        'from-lime-400 to-green-500',
        'from-fuchsia-400 to-purple-500'
    ];
    let hash = 0;
    if (!name) return 'bg-gradient-to-br from-slate-400 to-slate-500';
    
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return `bg-gradient-to-br ${gradients[index]}`;
};

export const getPageBackground = (view: string): string => {
    switch (view) {
        case 'dashboard': return 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-purple-50 to-white';
        case 'patients': return 'bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-teal-100 via-emerald-50 to-white';
        case 'clients': return 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100 via-cyan-50 to-white';
        case 'treatments': return 'bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-rose-100 via-orange-50 to-white';
        case 'appointments': return 'bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-violet-100 via-fuchsia-50 to-white';
        case 'pos': return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-100 via-gray-50 to-white';
        case 'inventory': return 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-100 via-yellow-50 to-white';
        case 'lab': return 'bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-100 via-sky-50 to-white';
        case 'reports': return 'bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-100 via-indigo-50 to-white';
        default: return 'bg-slate-50';
    }
};

export const getCurrencySymbol = (currencyCode: string): string => {
    const symbolMap: Record<string, string> = {
        'NGN': '₦',
        'USD': '$',
        'GBP': '£',
        'EUR': '€',
        'KES': 'KSh',
        'GHS': '₵',
        'ZAR': 'R'
    };
    return symbolMap[currencyCode] || currencyCode;
};

export const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
    const symbol = getCurrencySymbol(currencyCode);
    
    // Format the number with commas and 2 decimal places
    const formattedAmount = Number(amount).toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });

    return `${symbol}${formattedAmount}`;
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

export const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'paid':
    case 'finalized':
      return 'bg-emerald-100 text-emerald-700';
    case 'pending':
    case 'scheduled':
    case 'draft':
      return 'bg-amber-100 text-amber-700';
    case 'cancelled':
    case 'suspended':
    case 'void':
      return 'bg-red-100 text-red-700';
    case 'in progress':
    case 'checked in':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};