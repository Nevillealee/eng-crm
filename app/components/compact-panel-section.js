"use client";

import { useEffect, useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

const accordionSx = {
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 2.5,
  bgcolor: "background.paper",
  "&::before": {
    display: "none",
  },
};

export default function CompactPanelSection({
  title,
  description = "",
  summary = "",
  defaultExpandedMobile = false,
  children,
}) {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("md"), { noSsr: true });
  const [expanded, setExpanded] = useState(Boolean(defaultExpandedMobile));

  useEffect(() => {
    setExpanded(Boolean(defaultExpandedMobile));
  }, [defaultExpandedMobile]);

  if (!isCompact) {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Stack spacing={0.75}>
            <Typography variant="h5">{title}</Typography>
            {description ? <Typography color="text.secondary">{description}</Typography> : null}
          </Stack>
          {children}
        </Stack>
      </Paper>
    );
  }

  return (
    <Accordion expanded={expanded} onChange={(_event, nextExpanded) => setExpanded(nextExpanded)} sx={accordionSx}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography variant="h6">{title}</Typography>
          {summary ? <Typography variant="body2" color="text.secondary">{summary}</Typography> : null}
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Stack spacing={2}>
          {description ? <Typography color="text.secondary">{description}</Typography> : null}
          {children}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
