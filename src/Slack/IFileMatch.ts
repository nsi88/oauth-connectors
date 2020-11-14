/**
 * Structure contained in WebAPICallResult.files.matches.
 *
 * Example:
 * channels: ["CT5GZD4C8"]
 * created: 1591207445
 * display_as_bot: false
 * edit_link: "https://skyscanner.slack.com/files/UE71AL9U4/F014SS49UUB/prs_20200603.csv/edit"
 * editable: true
 * external_type: ""
 * filetype: "csv"
 * groups: []
 * has_rich_preview: false
 * id: "F014SS49UUB"
 * ims: []
 * is_external: false
 * is_public: true
 * is_starred: false
 * lines: 1724
 * lines_more: 1719
 * mimetype: "text/csv"
 * mode: "snippet"
 * name: "prs_20200603.csv"
 * permalink: "https://skyscanner.slack.com/files/UE71AL9U4/F014SS49UUB/prs_20200603.csv"
 * permalink_public: "https://slack-files.com/T03HP6RD0-F014SS49UUB-35f1757cca"
 * pretty_type: "CSV"
 * preview: "repository_full_name,avg_pr_open_time_mins,average_bump_pr_open_time_mins,total_bump_prs_received
 * ↵mshell-batch/mshell-batch-py3,54,-1,3
 * ↵optimise-prime/operational-metrics-weekly-tracker,579,5249,0
 * ↵logging-services/grappler-enrichment,-1,-1,1
 * ↵dmx/artifactory-cli-login,126711,-1,0
 * "
 * preview_highlight: "<div class="CodeMirror cm-s-default CodeMirrorServer" oncopy="if(event.clipboardData){event.clipboardData.setData('text/plain',window.getSelection().toString().replace(/\u200b/g,''));event.preventDefault();event.stopPropagation();}">↵<div class="CodeMirror-code">↵<div><pre>repository_full_name,avg_pr_open_time_mins,average_bump_pr_open_time_mins,total_bump_prs_received</pre></div>↵<div><pre>mshell-batch/mshell-batch-py3,54,-1,3</pre></div>↵<div><pre>optimise-prime/operational-metrics-weekly-tracker,579,5249,0</pre></div>↵<div><pre>logging-services/grappler-enrichment,-1,-1,1</pre></div>↵<div><pre>dmx/artifactory-cli-login,126711,-1,0</pre></div>↵<div><pre></pre></div>↵</div>↵</div>↵"
 * preview_is_truncated: true
 * public_url_shared: false
 * shares: {public: {…}}
 * size: 71336
 * timestamp: 1591207445
 * title: "prs_20200603.csv"
 * url_private: "https://files.slack.com/files-pri/T03HP6RD0-F014SS49UUB/prs_20200603.csv"
 * url_private_download: "https://files.slack.com/files-pri/T03HP6RD0-F014SS49UUB/download/prs_20200603.csv"
 * user: "UE71AL9U4"
 * username: ""
 */
export default interface IFileMatch {
  id: string;
  title: string;
  preview?: string;
  permalink: string;
  timestamp: number;
  user: string;
}
