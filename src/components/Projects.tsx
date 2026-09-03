import React, { useState } from 'react';
import {
  Code2,
  ExternalLink,
  Github,
  Gamepad2,
  GraduationCap,
  FileSpreadsheet,
  BarChart3,
  X,
  ChevronRight,
  Layers
} from 'lucide-react';
import { PROJECTS } from '../data/portfolioData';
import { ProjectItem } from '../types';

interface ProjectsProps {
  darkMode: boolean;
}

export const Projects: React.FC<ProjectsProps> = ({ darkMode }) => {
  const [activeFilter, setActiveFilter] = useState<string>('Semua');
  const [activeModalProject, setActiveModalProject] = useState<ProjectItem | null>(null);

  const categories = ['Semua', ...Array.from(new Set(PROJECTS.map((p) => p.category)))];

  const filteredProjects =
    activeFilter === 'Semua'
      ? PROJECTS
      : PROJECTS.filter((p) => p.category === activeFilter);

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'Dice': return <Gamepad2 className="w-3.5 h-3.5" />;
      case 'GraduationCap': return <GraduationCap className="w-3.5 h-3.5" />;
      case 'FileSpreadsheet': return <FileSpreadsheet className="w-3.5 h-3.5" />;
      case 'BarChart3': return <BarChart3 className="w-3.5 h-3.5" />;
      default: return <Code2 className="w-3.5 h-3.5" />;
    }
  };

  const getBadgeClasses = (colorScheme: string) => {
    switch (colorScheme) {
      case 'amber':
        return darkMode
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          : 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'teal':
        return darkMode
          ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
          : 'bg-teal-500/10 text-teal-600 border-teal-500/30';
      case 'indigo':
        return darkMode
          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
          : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30';
      default:
        return darkMode
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
    }
  };

  return (
    <section
      id="proyek"
      className={`py-14 md:py-20 transition-colors duration-200 ${darkMode ? 'bg-slate-950 border-t border-slate-800' : 'bg-slate-50 border-t border-slate-200'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode
            ? 'text-teal-400 bg-teal-950/60 border border-teal-800'
            : 'text-teal-600 bg-teal-50 border border-teal-200'
            }`}>
            <Layers className="w-3.5 h-3.5" />
            <span>Proyek & Karya</span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'
            }`}>
            Portofolio Proyek
          </h2>
          <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
            Proyek indie yang sudah dirilis dan web app internal untuk kebutuhan bisnis nyata — dari game, aplikasi edukasi, hingga sistem manajemen aset.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${activeFilter === cat
                ? 'bg-teal-600 text-white border-teal-600'
                : darkMode
                  ? 'text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 border-slate-300 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-14">
          {filteredProjects.map((project, idx) => {
            const isFirstFeatured = project.isFeatured && idx === 0;
            return (
              <div
                key={project.id}
                className={`${isFirstFeatured ? 'md:col-span-12' : 'md:col-span-6 lg:col-span-4'
                  } group`}
              >
                <div
                  className={`h-full p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-1 cursor-pointer ${darkMode
                    ? 'bg-slate-900 border-slate-700 hover:border-slate-600'
                    : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                    }`}
                  onClick={() => setActiveModalProject(project)}
                >
                  {/* Badge & Year */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${getBadgeClasses(project.colorScheme)}`}>
                      {getIcon(project.iconType)}
                      {project.badge}
                    </span>
                    <span className={`text-[11px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                      {project.year}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className={`text-lg sm:text-xl font-bold tracking-tight mb-2 transition-colors ${darkMode
                    ? 'text-white group-hover:text-teal-400'
                    : 'text-slate-900 group-hover:text-teal-600'
                    }`}>
                    {project.title}
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed mb-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                    {project.description}
                  </p>

                  {/* Highlights */}
                  <ul className="space-y-1 mb-4">
                    {project.highlights.slice(0, 3).map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <ChevronRight className={`w-3 h-3 flex-shrink-0 mt-0.5 ${darkMode ? 'text-teal-400' : 'text-teal-500'
                          }`} />
                        <span className={`text-[11px] ${darkMode ? 'text-slate-300' : 'text-slate-600'
                          }`}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Tech Stack Chips */}
                  <div className={`flex flex-wrap gap-1.5 pt-2 border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'
                    }`}>
                    {project.techStack.slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${darkMode
                          ? 'bg-slate-800 border-slate-700 text-slate-300'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                      >
                        {tech}
                      </span>
                    ))}
                    {project.techStack.length > 4 && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                        +{project.techStack.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project Detail Modal */}
      {activeModalProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setActiveModalProject(null)}
        >
          <div
            className={`w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`sticky top-0 z-10 p-4 sm:p-5 border-b flex items-center justify-between ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
              }`}>
              <div>
                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border mb-1.5 ${getBadgeClasses(activeModalProject.colorScheme)}`}>
                  {getIcon(activeModalProject.iconType)}
                  {activeModalProject.badge}
                </span>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {activeModalProject.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalProject(null)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-5">
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>
                {activeModalProject.longDescription}
              </p>

              {/* Highlights */}
              <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-white' : 'text-slate-900'
                  }`}>Fitur Utama</h4>
                <ul className="space-y-1.5">
                  {activeModalProject.highlights.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-teal-400' : 'text-teal-500'
                        }`} />
                      <span className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tech Stack */}
              <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-white' : 'text-slate-900'
                  }`}>Tech Stack</h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeModalProject.techStack.map((tech) => (
                    <span
                      key={tech}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-md border ${darkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-300'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Role & Year */}
              <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                <div className="flex flex-wrap justify-between gap-2 text-xs">
                  <div>
                    <span className={`font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Peran: </span>
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {activeModalProject.role}
                    </span>
                  </div>
                  <div>
                    <span className={`font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tahun: </span>
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {activeModalProject.year}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`sticky bottom-0 p-4 border-t flex items-center justify-between gap-3 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
              }`}>
              <button
                onClick={() => setActiveModalProject(null)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${darkMode
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
              >
                Tutup
              </button>
              <div className="flex items-center gap-2">
                {activeModalProject.githubUrl && (
                  <a
                    href={activeModalProject.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${darkMode
                      ? 'border-slate-700 text-slate-200 hover:bg-slate-800'
                      : 'border-slate-300 text-slate-800 hover:bg-slate-100'
                      }`}
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>Source</span>
                  </a>
                )}
                {activeModalProject.demoUrl && (
                  <a
                    href={activeModalProject.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-colors"
                  >
                    <span>Buka Demo Live</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};