import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import UserDirectory from '../../components/settings/UserDirectory'

export default function Customers() {
    const navigate = useNavigate()

    return (
        <div>
            <PageHeader
                eyebrow="Clients"
                title="Customers"
                description="Everyone with a website account. Open a customer to see their details and history with AVENtures."
            />
            <div className="mt-6">
                <UserDirectory
                    scope="customers"
                    emptyTitle="No customers found"
                    emptyBody="Customers appear here after they sign in to the website for the first time."
                    onSelect={(user) => navigate(user.id)}
                />
            </div>
        </div>
    )
}
