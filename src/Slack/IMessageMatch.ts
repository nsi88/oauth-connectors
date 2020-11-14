import IChannel from './IChannel';

/**
 * Structure contained in WebAPICallResult.messages.matches.
 *
 * Exmaple:
 * iid: "09d3d485-cf5a-4ef7-a0d6-92b5233f117e"
 * team: "TSZHFF2LQ"
 * channel: {id: "CT3U17W0G", is_channel: true, is_group: false, is_im: false, name: "test1", …}
 * type: "message"
 * user: "USZ43DGBE"
 * username: "novikovseregka"
 * ts: "1583606211.001200"
 * blocks: [{…}]
 * text: "What if I will write a long test text,↵containing many lines?↵Will the search api return all the text,↵or it will shrink it?↵Interesting.↵Text should be long enough already.↵No one writes to slack more anyway)"
 * permalink: "https://loocle.slack.com/archives/CT3U17W0G/p1583606211001200"
 * no_reactions: true
 */
export default interface IMessageMatch {
  iid: string;
  team: string;
  channel: IChannel;
  type: string;
  user: string;
  username: string;
  ts: string;
  blocks: Array<Object>;
  text: string;
  permalink: string;
  no_reactions: boolean;
}
