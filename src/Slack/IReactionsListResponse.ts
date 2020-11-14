// Example 1
// {
//   "type": "message",
//   "channel": "CT3U17W0G",
//   "message": {
//     "client_msg_id": "f0a558e4-e3b4-4957-a780-95905ea0cd0c",
//     "type": "message",
//     "text": "more than one test word",
//     "user": "USZ43DGBE",
//     "ts": "1579953722.000700",
//     "team": "TSZHFF2LQ",
//     "blocks": [{
//       "type": "rich_text",
//       "block_id": "JWi",
//       "elements": [{
//         "type": "rich_text_section",
//         "elements": [{"type": "text", "text": "more than one test word"}]
//       }]
//     }],
//     "reactions": [{"name": "smirk", "users": ["USZ43DGBE"], "count": 1}],
//     "permalink": "https://loocle.slack.com/archives/CT3U17W0G/p1579953722000700"
//   }
// }

// Example 2
// {
//   "type": "message",
//   "channel": "CT3U17W0G",
//   "message": {
//     "type": "message",
//     "text": "",
//     "files": [{
//       "id": "F01CZUZGSK1",
//       "created": 1603813851,
//       "timestamp": 1603813851,
//       "name": "500_lines_or_less.pdf",
//       "title": "500_lines_or_less.pdf",
//       "mimetype": "application/pdf",
//       "filetype": "pdf",
//       "pretty_type": "PDF",
//       "user": "USZ43DGBE",
//       "editable": false,
//       "size": 9332159,
//       "mode": "hosted",
//       "is_external": false,
//       "external_type": "",
//       "is_public": true,
//       "public_url_shared": false,
//       "display_as_bot": false,
//       "username": "",
//       "url_private": "https://files.slack.com/files-pri/TSZHFF2LQ-F01CZUZGSK1/500_lines_or_less.pdf",
//       "url_private_download": "https://files.slack.com/files-pri/TSZHFF2LQ-F01CZUZGSK1/download/500_lines_or_less.pdf",
//       "thumb_pdf": "https://files.slack.com/files-tmb/TSZHFF2LQ-F01CZUZGSK1-4a64542059/500_lines_or_less_thumb_pdf.png",
//       "thumb_pdf_w": 819,
//       "thumb_pdf_h": 1065,
//       "permalink": "https://loocle.slack.com/files/USZ43DGBE/F01CZUZGSK1/500_lines_or_less.pdf",
//       "permalink_public": "https://slack-files.com/TSZHFF2LQ-F01CZUZGSK1-59ce552c79",
//       "is_starred": false,
//       "has_rich_preview": false
//     }],
//     "upload": false,
//     "user": "USZ43DGBE",
//     "display_as_bot": false,
//     "ts": "1603813856.000400",
//     "reactions": [{"name": "two", "users": ["USZ43DGBE"], "count": 1}],
//     "permalink": "https://loocle.slack.com/archives/CT3U17W0G/p1603813856000400"
//   }
// }

export default interface IReactionsListResponse {
  ok: boolean;
  error?: string;
  items?: Item[];
}

interface Item {
  type: string; // e.g. "message",
  message?: Message;
}

interface Message {
  // NOTE: NOt client_msg_id is used, because it looks like they are different from iid field returned
  //  from search. Also permilinks use ts as well as an identifier.
  ts: string; // e,g, "1579953722.000700",
  files?: File[];
}

interface File {
  id: string; // e.g. "F01CZUZGSK1",
}
