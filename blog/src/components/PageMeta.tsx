import { Helmet } from "react-helmet-async";

interface PageMetaProps {
  title: string;
  description?: string;
  image?: string;
}

const SITE_NAME = "Trăn trở của 1 kẻ khó ở";
const DEFAULT_DESCRIPTION = "Blog chia sẻ suy nghĩ, cảm xúc và trải nghiệm đời sống thường ngày.";
const DEFAULT_IMAGE = "/default-thumbnail.jpg";

function PageMeta({ title, description = DEFAULT_DESCRIPTION, image = DEFAULT_IMAGE }: PageMetaProps) {
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
    </Helmet>
  );
}

export default PageMeta;
