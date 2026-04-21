import { motion } from 'motion/react';
import { GraduationCap, CheckCircle2, Calendar, ArrowRight } from 'lucide-react';
import type { Curso } from '../types';

type CourseCardProps = { curso: Curso; isAcquired?: boolean };

export function CourseCard({ curso, isAcquired }: CourseCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full">
      <div className="h-40 bg-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gov-blue/10 to-gov-blue-dark/10" />
        <div className="absolute inset-0 flex items-center justify-center">
          <GraduationCap className="w-16 h-16 text-gov-blue/20" />
        </div>
        {isAcquired && (
          <div className="absolute top-3 right-3 bg-gov-green text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg">
            <CheckCircle2 className="w-3 h-3" /> Adquirido
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex flex-wrap gap-2 mb-3">
          {curso.tags.split(',').map((tag) => (
            <span key={tag} className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">
              {tag.trim()}
            </span>
          ))}
        </div>
        <h4 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-gov-blue transition-colors line-clamp-2">
          {curso.nome}
        </h4>
        <p className="text-sm text-slate-500 mb-4 line-clamp-2">Oferecido por {curso.quem_criou}</p>

        {isAcquired && (
          <div className="mb-4">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1">
              <span>Progresso</span>
              <span>{(curso as Curso & { progress?: number }).progress || 0}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(curso as Curso & { progress?: number }).progress || 0}%` }}
                className="h-full bg-gov-green"
              />
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Calendar className="w-3 h-3" /> 20h de conteúdo
          </div>
          <div className="text-gov-blue font-bold text-sm flex items-center gap-1">
            {isAcquired ? 'Continuar' : 'Ver mais'} <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
