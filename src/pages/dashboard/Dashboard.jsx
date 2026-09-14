import { Box, Grid, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import DiamondIcon from "@mui/icons-material/Diamond";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import GroupsIcon from "@mui/icons-material/Groups";
import ForumIcon from "@mui/icons-material/Forum";

import "../../styles/dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "مشغل التصاليح",
      icon: <PersonAddAltIcon sx={{ fontSize: 30 }} />,
      path: "/repairs",
    },
    {
      title: "مشغل التفصيل",
      icon: <DiamondIcon sx={{ fontSize: 30 }} />,
      path: "/detail",
    },
    {
      title: "الاسعار (عالي/واطي)",
      icon: <LocalOfferIcon sx={{ fontSize: 30 }} />,
      path: "/prices",
    },
    {
      title: "شؤون الموظفين",
      icon: <GroupsIcon sx={{ fontSize: 30 }} />,
      path: "/accounts",
    },
    {
      title: "CliQ",
      icon: (
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "2px solid #fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.6rem",
            fontWeight: 800,
          }}
        >
          CliQ
        </Box>
      ),
      path: "/cliq",
    },
    {
      title: "التواصل المباشر مع الادارة",
      icon: <ForumIcon sx={{ fontSize: 30 }} />,
      path: "/contact",
    },
  ];

  return (
    <div className="dashboard-container">
      {/* Welcome */}
      <div className="dashboard-welcome">
        <Typography className="dashboard-welcome-sub">مرحباً بك في</Typography>
        <Typography className="dashboard-welcome-title">
          مجموعة عايد دعنا
        </Typography>
      </div>

      {/* Cards Grid */}
      <Grid
        container
        spacing={{ xs: 2, sm: 3 }}
        className="dashboard-grid"
      >
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.title}>
            <Paper
              elevation={0}
              onClick={() => navigate(card.path)}
              className="dashboard-card"
            >
              <div className="dashboard-card-circle">{card.icon}</div>
              <Typography className="dashboard-card-title">
                {card.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}