import ErrorPage from '@/components/error/ErrorPage';

export default function NotFound() {
  return (
    <ErrorPage
      statusCode={404}
      title="Page Not Found"
      message="The page you're looking for doesn't exist or has been moved."
      showRetry={false}
      showHome={true}
      showBack={true}
    />
  );
}
