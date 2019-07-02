import { graphql, Link, StaticQuery } from 'gatsby';
import * as React from 'react';
import { css } from '@emotion/core';

import config from '../../website-config';

const SiteNavLogoStyles = css`
  flex-shrink: 0;
  display: block;
  margin-right: 24px;
  padding: 11px 0;
  color: #fff;
  font-size: 1.7rem;
  line-height: 1em;
  font-weight: bold;
  letter-spacing: -0.5px;

  :hover {
    text-decoration: none;
  }

  img {
    display: block;
    width: auto;
    height: 21px;
  }
`;

interface SiteNavLogoProps {
  logo?: {
    childImageSharp: {
      fixed: any;
    };
  };
}

const SiteNavLogo = () => (
  <StaticQuery
    query={graphql`
      query HeadingQuery {
        logo: file(relativePath: { eq: "img/ghost-logo.png" }) {
          childImageSharp {
            fixed {
              ...GatsbyImageSharpFixed
            }
          }
        }
      }
    `}
    // tslint:disable-next-line:react-this-binding-issue
    render={(data: SiteNavLogoProps) => (
      <Link className="site-nav-logo" css={SiteNavLogoStyles} to="/">
        {data.logo ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="240" height="21" viewBox="0 0 14930 1299">
            <text
              id="NOVEMBER_OSCAR"
              data-name="NOVEMBER/OSCAR"
              transform="translate(0 1039)"
              fill="#fff"
              font-size="1000"
              font-family="Futura-Medium, Futura"
              font-weight="500"
              letter-spacing="0.4em"
            >
              <tspan x="0" y="0">
                NOVEMBER/OSCAR
              </tspan>
            </text>
          </svg>
        ) : (
          config.title
        )}
      </Link>
    )}
  />
);

export default SiteNavLogo;
