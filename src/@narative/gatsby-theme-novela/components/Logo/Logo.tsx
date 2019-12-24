import React from "react";
import styled from "@emotion/styled";

import mediaqueries from "@narative/gatsby-theme-novela/src/styles/media";

import { Icon } from '@narative/gatsby-theme-novela/src/types';
import Headings from "@narative/gatsby-theme-novela/src/components/Headings";

const Logo: Icon = ({ fill = "white" }) => {
    return (
        <LogoContainer>
            <Headings.h3 className="Logo__Desktop">
                <text>🤖 🐍<br /> 🛠 👨‍💻</text>
            </Headings.h3>
            <Headings.h1 className="Logo__Mobile">🤖</Headings.h1>
        </LogoContainer>
    );
};

export default Logo;

const LogoContainer = styled.div`
  .Logo__Mobile {
                display: none;
          }
        
  ${mediaqueries.tablet`
    .Logo__Desktop {
      display: none;
    }
    
    .Logo__Mobile{
      display: block;
    }
  `}
            `;