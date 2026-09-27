import React from 'react';
import { getH2ClassName } from '../../lib/preview-utils';
import { translateSectionTitle } from '../../lib/section-translator';
import { COMPREHENSIVE_DATE_REGEX, formatDateRange } from '../../lib/date-parser';
import { getMarketProfile } from '../../lib/market-profile';

// Static constants lifted out of render cycle to prevent repeated compilation and memory allocation overhead
const SPLIT_REGEX = /[　]|\s*[|｜·•]\s*|\s{2,}/g;

const ROLE_KEYWORDS = [
  '架构师', '工程师', '开发', '负责人', '独立开发者', '开发者', '专家', '管理', '设计', '组长', 
  '经理', '总监', '合伙人', '实习生', '运营', '主持', '教师', '讲师', '核心开发', '核心成员',
  'Intern', 'Architect', 'Engineer', 'Developer', 'Lead', 'Manager', 'Consultant'
];


function getChildrenText(children: any): string {
  let text = '';
  React.Children.forEach(children, (child) => {
    if (typeof child === 'string') {
      text += child;
    } else if (typeof child === 'number') {
      text += String(child);
    } else if (child && typeof child === 'object' && 'props' in child) {
      const props = (child as any).props;
      if (props && props.children) {
        text += getChildrenText(props.children);
      }
    }
  });
  return text;
}

function renderStructuralRow(
  children: any,
  sizeClasses: any,
  theme: any,
  defaultRender: () => React.ReactElement,
  settings?: any
): React.ReactElement {
  const textContent = getChildrenText(children).trim();

  let datePart = '';
  let mainText = textContent;
  
  const matches = textContent.match(COMPREHENSIVE_DATE_REGEX);
  if (matches && matches.length > 0) {
    datePart = matches[0].trim();
    mainText = textContent.replace(COMPREHENSIVE_DATE_REGEX, '').trim();
    mainText = mainText.replace(/[\*\s\(\)]+$/, '').trim();
    mainText = mainText.replace(/^[\*\s\(\)]+/, '').trim();
  }

  const hasExplicitDivider = /[|｜\u3000]|\s*[·•]\s*|\s+[/／]\s+/.test(mainText);
  const isShortLine = textContent.length < 90;

  if (isShortLine && (hasExplicitDivider || datePart !== '') && (datePart || (hasExplicitDivider && textContent.length < 50))) {
    // Split segments
    const segments = mainText.split(SPLIT_REGEX).map(s => s.trim()).filter(Boolean);

    if (segments.length > 0) {
      let companyOrProject = segments[0] || '';
      let roleOrTitle = segments[1] || '';

      if (segments.length >= 2) {
        const s0IsRole = ROLE_KEYWORDS.some(keyword => segments[0].includes(keyword));
        const s1IsRole = ROLE_KEYWORDS.some(keyword => segments[1].includes(keyword));

        if (s0IsRole && !s1IsRole) {
          companyOrProject = segments[1];
          roleOrTitle = segments[0];
        }
      }

      // Format datePart according to market profile dateStyle if available
      let formattedDate = datePart;
      if (datePart && settings) {
        const market = getMarketProfile(settings.marketRegion);
        formattedDate = formatDateRange(datePart, market.dateStyle, settings.lang === 'en');
      }

      // Elegant premium typography for resume headers
      return (
        <div className="flex flex-row items-baseline justify-between gap-4 border-b border-gray-100/70 pb-1.5 mt-5 mb-2 break-inside-avoid break-after-avoid w-full">
          <div className="flex flex-wrap items-baseline gap-x-2.5">
            {companyOrProject && (
              <span className="font-bold text-gray-950 tracking-tight text-[14px]">
                {companyOrProject}
              </span>
            )}
            
            <div className="flex flex-wrap items-center gap-2 text-gray-650 font-medium text-[13px]">
              {roleOrTitle && (
                <>
                  <span className="text-gray-300 select-none text-[10px]">•</span>
                  <span>{roleOrTitle}</span>
                </>
              )}

              {segments.slice(2).map((extra, idx) => (
                <React.Fragment key={idx}>
                  <span className="text-gray-300 select-none text-[10px]">•</span>
                  <span>{extra}</span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {formattedDate && (
            <span className="text-gray-500 font-semibold font-mono whitespace-nowrap ml-auto tabular-nums text-[12.5px]">
              {formattedDate}
            </span>
          )}
        </div>
      );
    }
  }

  return defaultRender();
}

function translateHeading(title: string, lang: string): string {
  if (lang !== 'en') return title;
  return translateSectionTitle(title, 'en');
}

export function createMarkdownComponents({
  headerInfo,
  sizeClasses,
  theme,
  settings,
}: {
  headerInfo: any;
  sizeClasses: any;
  theme: any;
  settings: any;
}) {
  return {
    h1: ({ node, ...props }: any) => headerInfo.hasHeader ? null : <h1 className={sizeClasses.h1} {...props} />,
    h2: ({ node, children, ...props }: any) => {
      const headingText = getChildrenText(children);
      const translated = translateHeading(headingText, settings.lang || 'zh');
      return (
        <h2 className={getH2ClassName(settings.fontSize, theme, settings.h2Style)} {...props}>
          {translated}
        </h2>
      );
    },
    h3: ({ node, children, ...props }: any) => {
      return renderStructuralRow(children, sizeClasses, theme, () => (
        <h3 className={sizeClasses.h3} {...props}>{children}</h3>
      ), settings);
    },
    h4: ({ node, children, ...props }: any) => {
      return renderStructuralRow(children, sizeClasses, theme, () => (
        <h4 className="text-[13px] font-bold text-gray-800 mt-2 mb-1" {...props}>{children}</h4>
      ), settings);
    },
    p: ({ node, children, ...props }: any) => {
      return renderStructuralRow(children, sizeClasses, theme, () => (
        <p className={sizeClasses.p} {...props}>{children}</p>
      ), settings);
    },
    ul: ({ node, ...props }: any) => <ul className={sizeClasses.ul} {...props} />,
    ol: ({ node, ...props }: any) => <ol className={sizeClasses.ol} {...props} />,
    li: ({ node, ...props }: any) => <li className={sizeClasses.li} {...props} />,
    strong: ({ node, ...props }: any) => <strong className="font-bold text-gray-900" {...props} />,
    em: ({ node, ...props }: any) => <em className="italic text-gray-500 font-normal" {...props} />,
    hr: ({ node, ...props }: any) => <hr className={sizeClasses.hr} {...props} />,
    a: ({ node, children, href, ...props }: any) => {
      const displayChildren = children;
      return (
        <a 
          href={href}
          target={href && (href.startsWith('mailto:') || href.startsWith('tel:')) ? undefined : "_blank"}
          rel={href && (href.startsWith('mailto:') || href.startsWith('tel:')) ? undefined : "noopener noreferrer"}
          className={`${theme.accentText} font-medium transition-colors break-words underline underline-offset-2 decoration-gray-200 hover:decoration-current`} 
          {...props}
        >
          {displayChildren}
        </a>
      );
    },
    blockquote: ({ node, ...props }: any) => <blockquote className={`border-l-4 ${theme.blockquoteAccent} pl-4 py-1 italic text-gray-600 my-4 rounded-r-md break-inside-avoid`} {...props} />,
    table: ({ node, ...props }: any) => (
      <div className={sizeClasses.table}>
        <table className="w-full text-left border-collapse border-y border-gray-100/40" {...props} />
      </div>
    ),
    thead: ({ node, ...props }: any) => <thead className="hidden" {...props} />,
    tr: ({ node, ...props }: any) => <tr className="border-b border-gray-100/50 last:border-0 hover:bg-slate-50/30 transition-colors" {...props} />,
    th: ({ node, ...props }: any) => <th className={sizeClasses.th} {...props} />,
    td: ({ node, ...props }: any) => (
      <td 
        className={`${sizeClasses.td} [&:first-child]:font-bold [&:first-child]:text-gray-900 [&:first-child]:whitespace-nowrap [&:first-child]:w-[110px] [&:first-child]:border-r [&:first-child]:border-gray-100/60 [&:first-child]:pr-4 [&:last-child]:pl-4`} 
        {...props} 
      />
    ),
  };
}
