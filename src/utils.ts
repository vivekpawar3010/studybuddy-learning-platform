import { FlaskConical, Calculator, PenTool, Clock, BookOpen } from 'lucide-react';

export const getColorClass = (color: string) => {
  switch (color) {
    case 'green': return 'bg-green-100 text-green-600';
    case 'blue': return 'bg-blue-100 text-blue-600';
    case 'purple': return 'bg-purple-100 text-purple-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export const getIcon = (subject: string) => {
    if (subject.includes('Bio') || subject.includes('Genetics')) return FlaskConical;
    if (subject.includes('Math')) return Calculator;
    if (subject.includes('History')) return Clock;
    if (subject.includes('Design')) return PenTool;
    return BookOpen;
};