import './styles.css';
export * from './protocol/envelope';
export * from './protocol/sanitize';
export * from './host/messages';
export * from './state/view-state';
export * from './viewer/viewer';

export const CONTENT_SECURITY_POLICY = "default-src 'none'; img-src 'none'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
