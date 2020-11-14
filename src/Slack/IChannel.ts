/**
 * Example:
 * id: "C08SK623U"
 * is_channel: true
 * is_ext_shared: false
 * is_group: false
 * is_im: false
 * is_mpim: false
 * is_org_shared: false
 * is_pending_ext_shared: false
 * is_private: false
 * is_shared: false
 * name: "security-support"
 */
export default interface IChannel {
  id: string;
  is_channel: boolean;
  is_ext_shared: boolean;
  is_group: boolean;
  is_im: boolean;
  is_mpim: boolean;
  is_org_shared: boolean;
  is_pending_ext_shared: boolean;
  is_private: boolean;
  is_shared: boolean;
  name: string;
}
