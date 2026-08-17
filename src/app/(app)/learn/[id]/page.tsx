import LearnTopicClient from './LearnTopicClient';

import { TOPIC_DATA } from '@/lib/learnData';

export function generateStaticParams() {
  return Object.keys(TOPIC_DATA).map((id) => ({
    id: id,
  }));
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <LearnTopicClient params={params} />;
}
