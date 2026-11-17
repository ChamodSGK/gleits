import { Link } from "react-router-dom";
import { ArrowLeft } from "../components/Icons.jsx";
import { PageHero, usePageMeta } from "../components/shared.jsx";

export default function NotFound() {
  usePageMeta("Page not found", "The page you were looking for could not be found.");
  return (
    <PageHero crumb="404" title="This page took a" accent="different path." description="The page you’re looking for doesn’t exist or has moved.">
      <Link to="/" className="btn btn-primary" style={{ marginTop: 40 }}>
        <ArrowLeft /> Back to home
      </Link>
    </PageHero>
  );
}
