import { Img, Section } from '@react-email/components';

export function Logo() {
  return (
    <Section className="mt-[32px]">
      {/* TODO(compliboss): host the CompliBoss logo and update this URL. */}
      <Img
        src={'https://assets.compliboss.com/logo.png'}
        width="45"
        height="45"
        alt="CompliBoss"
        className="mx-auto my-0 block"
      />
    </Section>
  );
}
