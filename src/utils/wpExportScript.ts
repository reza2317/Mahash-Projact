// src/utils/wpExportScript.ts
import { getAllReports, getTeamOverrides } from './reportsStore';

/**
 * Exports current LocalStorage data into a JSON format compatible with WordPress
 * Can be used with WP-CLI tools or a custom WordPress import plugin.
 */
export function exportDataForWordPress() {
  const reports = getAllReports();
  const teamOverrides = getTeamOverrides();

  // Map reports to standard WordPress post format
  const wpPosts = reports.map(report => ({
    post_title: report.title,
    post_content: report.summary || '',
    post_status: report.status === 'draft' ? 'draft' : 'publish',
    post_type: 'mahash_report',
    post_date: report.datetimeIso ? new Date(report.datetimeIso).toISOString() : new Date().toISOString(),
    post_author: 'Admin',
    meta_input: {
      team_id: report.teamSlug || '',
      video_url: report.videoSrc || '',
      images: report.images || [],
      report_num: report.reportNum || '',
    }
  }));

  // Map teams to custom post type or taxonomy
  const wpTeams = Object.keys(teamOverrides).map(teamId => {
    const team = teamOverrides[teamId];
    return {
      post_title: team.name || teamId,
      post_type: 'mahash_team',
      post_status: 'publish',
      meta_input: {
        team_slug: teamId,
        logo_url: team.logo || '',
        description: team.description || '',
      }
    };
  });

  const exportData = {
    posts: wpPosts,
    teams: wpTeams,
    export_date: new Date().toISOString(),
    version: '1.0'
  };

  return exportData;
}

/**
 * Triggers a download of the exported JSON file
 */
export function downloadWpExport() {
  const data = exportDataForWordPress();
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `wp_export_${new Date().getTime()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
